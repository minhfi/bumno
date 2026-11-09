import { findMenuItem } from "@/config/menu";
import type { OrderLine } from "./types";

export type RequestedItem = { productId: string; quantity: number };

/**
 * Prices an order from the menu config. Client prices are never used; lines with quantity 0 are dropped.
 * Throws if a product is not on the menu (the schema rejects those before this is called).
 */
export function priceOrder(items: RequestedItem[]): { lines: OrderLine[]; total: number } {
  const lines: OrderLine[] = [];
  for (const { productId, quantity } of items) {
    if (quantity <= 0) continue;
    const product = findMenuItem(productId);
    if (!product) throw new Error(`Unknown product: ${productId}`);
    lines.push({ productId, name: product.name, unitPrice: product.price, quantity });
  }
  const total = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  return { lines, total };
}
