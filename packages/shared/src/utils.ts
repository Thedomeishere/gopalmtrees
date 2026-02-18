import { TAX_RATES, DELIVERY_FEE } from "./constants";
import type { CartItem } from "./types";

export function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function calculateTax(subtotal: number, state: string): number {
  const rate = TAX_RATES[state] ?? TAX_RATES.DEFAULT;
  return Math.round(subtotal * rate * 100) / 100;
}

export function calculateTotal(items: CartItem[], state: string): {
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
} {
  const subtotal = calculateSubtotal(items);
  const tax = calculateTax(subtotal, state);
  const deliveryFee = DELIVERY_FEE;
  const total = Math.round((subtotal + tax + deliveryFee) * 100) / 100;
  return { subtotal, tax, deliveryFee, total };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}
