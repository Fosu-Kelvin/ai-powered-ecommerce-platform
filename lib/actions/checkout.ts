"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import axios from "axios";
import { client } from "@/sanity/lib/client";
import { getOrCreatePaystackCustomer } from "./customer";
import type { ShippingAddress } from "@/lib/types/address";

export async function createPaystackCheckout(
  items: any[],
  shippingAddress: ShippingAddress,
) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    if (!userId || !user) throw new Error("Unauthorized");

    // 1. Fetch products from Sanity to get current prices and verify IDs
    const productIds = items.map(i => i.productId);
    const sanityProducts = await client.fetch(`*[_type == "product" && _id in $productIds]`, { productIds });

    let totalGHS = 0;
    const lineItems = items.map(item => {
      // We look for the product using _id. 
      // This confirms item.productId IS a Sanity _id.
      const p = sanityProducts.find((sp: any) => sp._id === item.productId);
      
      if (!p) throw new Error(`Product not found: ${item.productId}`);
      
      totalGHS += (p.price * item.quantity);
      
      return { 
        id: item.productId, // This is the Sanity _id used for stock reduction later
        qty: item.quantity,
        price: p.price 
      };
    });

    // 2. Get or Create Paystack Customer
    const { paystackCustomerCode, sanityCustomerId } = await getOrCreatePaystackCustomer(
      user.emailAddresses[0].emailAddress,
      `${user.firstName} ${user.lastName}`,
      userId
    );

    // 💡 Fix for the "unused variable": 
    // We send paystackCustomerCode to Paystack so the transaction is linked 
    // to their existing profile in the Paystack Dashboard.
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: user.emailAddresses[0].emailAddress,
        amount: Math.round(totalGHS * 100), // Total in Pesewas
        currency: "GHS",
        customer: paystackCustomerCode, // <--- Now it's being used!
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success`,
        metadata: {
          clerkUserId: userId,
          sanityCustomerId,
          cartItems: lineItems,
          shippingAddress,
        },
      },
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );

    return { success: true, url: response.data.data.authorization_url };
  } catch (error: any) {
    console.error("Checkout Error:", error.message);
    return { success: false, error: error.message };
  }
}
