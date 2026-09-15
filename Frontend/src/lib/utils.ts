import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: string | number | undefined): string {
  if (!amount) return "Undisclosed";
  const num = typeof amount === "string" ? parseFloat(amount.replace(/[^0-9.]/g, "")) : amount;
  if (isNaN(num) || num === 0) return "Undisclosed";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatRating(rating: number | undefined): string {
  if (rating === undefined || rating === null) return "N/A";
  return rating.toFixed(1);
}
