import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get("reference");

  if (!reference) {
    return NextResponse.json({ error: "No reference provided" }, { status: 400 });
  }

  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Verification error:", error.response?.data || error.message);
    return NextResponse.json({ error: "Failed to verify transaction" }, { status: 500 });
  }
}