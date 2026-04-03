import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a price amount with Ghana Cedi currency formatting
 * @param amount - The price amount
 * @param currencyCode - Default is "GHS"
 * @returns Formatted price string (e.g., "GH₵599.99")
 */
export function formatPrice(
  amount: number | null | undefined,
  currencyCode = "GHS"
): string {
  if (amount === null || amount === undefined) return "GH₵0.00";

  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: currencyCode,
  }).format(amount);
}

type DateFormatOption = "short" | "long" | "datetime";

const DATE_FORMAT_OPTIONS: Record<
  DateFormatOption,
  Intl.DateTimeFormatOptions
> = {
  short: { day: "numeric", month: "short" },
  long: { day: "numeric", month: "long", year: "numeric" },
  datetime: {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  },
};

/**
 * Format a date string with Ghana-specific formatting
 */
export function formatDate(
  date: string | null | undefined,
  format: DateFormatOption = "long",
  fallback = "Date unknown"
): string {
  if (!date) return fallback;
  // Changed "en-GB" to "en-GH" to stay consistent with the locale
  return new Date(date).toLocaleDateString(
    "en-GH",
    DATE_FORMAT_OPTIONS[format]
  );
}

export function formatOrderNumber(
  orderNumber: string | null | undefined
): string {
  if (!orderNumber) return "N/A";
  return orderNumber.split("-").pop() ?? orderNumber;
}