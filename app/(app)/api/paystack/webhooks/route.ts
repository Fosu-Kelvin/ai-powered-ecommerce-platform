import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { writeClient } from "@/sanity/lib/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const secret = process.env.PAYSTACK_SECRET_KEY!;

    // 1. SECURITY: Verify the request came from Paystack
    const hash = crypto.createHmac("sha512", secret).update(body).digest("hex");
    if (hash !== req.headers.get("x-paystack-signature")) {
      console.error("❌ Invalid Signature");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const event = JSON.parse(body);

    if (event.event === "charge.success") {
      const data = event.data;
      console.log("👉 Step 1: Received Paystack Data for:", data.reference);

      let metadata = data.metadata;
      if (typeof metadata === "string") metadata = JSON.parse(metadata);

      const { clerkUserId, sanityCustomerId, cartItems, shippingAddress } =
        metadata || {};

      if (!sanityCustomerId || !Array.isArray(cartItems)) {
        console.error(
          "❌ Step 3 FAILED: sanityCustomerId or cartItems missing!",
        );
        return new NextResponse("Missing metadata", { status: 400 });
      }

      console.log("👉 Step 4: Initializing Sanity Transaction...");
      const transaction = writeClient.transaction();

      // --- CREATE THE ORDER ---
      transaction.create({
        _type: "order",
        orderNumber: data.reference,
        paystackReference: data.reference,
        clerkUserId: clerkUserId || "anonymous",
        customer: { _type: "reference", _ref: sanityCustomerId },
        total: data.amount / 100,
        status: "paid",
        email: data.customer.email,
        address: shippingAddress
          ? {
              name: shippingAddress.name ?? "",
              hostelName: shippingAddress.hostelName ?? "",
              roomNumber: shippingAddress.roomNumber ?? "",
              location: shippingAddress.location ?? "",
            }
          : undefined,
        createdAt: new Date().toISOString(),
        items: cartItems.map((item: any) => ({
          // Using product ID for the key prevents duplicate key errors on retry
          _key: `item-${item.id}`,
          product: {
            _type: "reference",
            _ref: item.id,
          },
          quantity: Number(item.qty),
          priceAtPurchase: Number(item.price),
        })),
      });

      // --- REDUCE THE STOCK ---
      cartItems.forEach((item: any) => {
        const qty = Number(item.qty);
        if (!isNaN(qty) && item.id) {
          // Atomic decrement of stock
          transaction.patch(item.id, (p) => p.dec({ stock: qty }));
          console.log(`📉 Queuing stock reduction for ${item.id}: -${qty}`);
        }
      });

      console.log("👉 Step 5: Committing Transaction to Sanity...");
      await transaction.commit();
      console.log("✅ SUCCESS! Order created and stock updated.");
    }

    return NextResponse.json({ status: "success" });
  } catch (err: any) {
    console.error("🔥 WEBHOOK CRASHED:", err.message);
    return new NextResponse(`Error: ${err.message}`, { status: 500 });
  }
}
