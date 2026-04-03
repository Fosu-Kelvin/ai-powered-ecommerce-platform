import { redirect } from "next/navigation";
import { SuccessClient } from "./SuccessClient";
import axios from "axios";

export const metadata = {
  title: "Order Confirmed | Furniture Shop",
  description: "Your order has been placed successfully",
};

interface SuccessPageProps {
  // Paystack sends 'reference', not 'session_id'
  searchParams: Promise<{ reference?: string }>;
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const reference = params.reference;

  if (!reference) {
    redirect("/");
  }

  // Verify the payment with Paystack directly
  // This ensures the user didn't just type the URL manually
  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const paymentData = response.data.data;

    if (paymentData.status !== "success") {
      redirect("/");
    }

    // Pass the verified data to your Client Component
    return <SuccessClient paymentData={paymentData} />;
  } catch (error) {
    console.error("Verification failed:", error);
    redirect("/");
  }
}