"use server";

import axios from "axios";
import { client, writeClient } from "@/sanity/lib/client";

export async function getOrCreatePaystackCustomer(email: string, name: string, clerkUserId: string) {
  // 1. Check Sanity first
  const query = `*[_type == "customer" && email == $email][0]`;
  const existing = await client.fetch(query, { email });

  if (existing?.paystackCustomerCode) {
    return { paystackCustomerCode: existing.paystackCustomerCode, sanityCustomerId: existing._id };
  }

  // 2. Create in Paystack
  const [firstName, ...lastNameParts] = name.split(" ");
  const response = await axios.post(
    "https://api.paystack.co/customer",
    { email, first_name: firstName, last_name: lastNameParts.join(" ") },
    { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
  );

  const paystackCustomerCode = response.data.data.customer_code;

  // 3. Save to Sanity
  let sanityId = existing?._id;
  if (existing) {
    await writeClient.patch(sanityId).set({ paystackCustomerCode, clerkUserId }).commit();
  } else {
    const created = await writeClient.create({
      _type: "customer",
      email,
      name,
      clerkUserId,
      paystackCustomerCode,
    });
    sanityId = created._id;
  }

  return { paystackCustomerCode, sanityCustomerId: sanityId };
}