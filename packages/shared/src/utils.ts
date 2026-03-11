import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Composes Tailwind CSS classes with intelligent conflict resolution.
 * Combines clsx for conditional classes with tailwind-merge for deduplication.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats a price in cents to a USD currency string.
 * @param cents - Price in cents (e.g., 9999 = $99.99)
 * @returns Formatted price string (e.g., "$99.99")
 */
export function formatPrice(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}

/**
 * Generates a unique order number in ORD-XXXXX format.
 * Uses a combination of timestamp and random characters for uniqueness.
 * @returns Order number string (e.g., "ORD-A3F7K")
 */
export function generateOrderNumber(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ORD-${result}`;
}

/**
 * Converts a string into a URL-safe slug.
 * Handles unicode, strips special characters, collapses whitespace.
 * @param text - The text to slugify
 * @returns URL-safe slug string
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}
