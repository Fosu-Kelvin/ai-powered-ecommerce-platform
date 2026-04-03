"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CheckCircle, Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useCartActions } from "@/lib/store/cart-store-provider";

// 1. Updated Interface for Paystack Data
interface SuccessClientProps {
  paymentData: {
    reference: string;
    amount: number; // In Pesewas
    status: string;
    paid_at: string;
    customer: {
      email: string;
      first_name?: string;
      last_name?: string;
    };
    metadata?: {
      // You can add custom fields here if you passed them in metadata
    }
  };
}

export function SuccessClient({ paymentData }: SuccessClientProps) {
  const { clearCart } = useCartActions();

  // Clear cart on mount
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
        <h1 className="mt-4 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Order Confirmed!
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Thank you for your purchase. We&apos;ve sent a confirmation to{" "}
          <span className="font-medium">{paymentData.customer.email}</span>
        </p>
      </div>

      <div className="mt-10 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
            Order Details
          </h2>
        </div>

        <div className="px-6 py-4">
          <div className="flex justify-between text-sm mb-4">
            <span className="text-zinc-600 dark:text-zinc-400">Reference Number</span>
            <span className="font-mono text-zinc-900 dark:text-zinc-100 uppercase">
              {paymentData.reference}
            </span>
          </div>

          <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <div className="flex justify-between text-base font-semibold">
              <span className="text-zinc-900 dark:text-zinc-100">Total Paid</span>
              <span className="text-zinc-900 dark:text-zinc-100">
                {formatPrice(paymentData.amount / 100)} {/* Convert Pesewas to GHS */}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-zinc-400" />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Payment status:{" "}
              <span className="font-medium capitalize text-green-600">
                {paymentData.status}
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild variant="outline">
          <Link href="/orders">
            View Your Orders
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild>
          <Link href="/">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
}