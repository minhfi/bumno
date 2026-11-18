import { findMenuItem } from "@/config/menu";
import type { OrderLine } from "./types";

export type RequestedItem = { productId: string; quantity: number };

/**
 * Prices an edited order. A line already in the order keeps its stored name and unit price (even if the product
 * left the menu); a new line is priced from the current menu. Lines with quantity 0 are dropped.
 * Returns the first product that is neither in the order nor on the menu instead of throwing.
 */
export function repriceOrder(
  existing: OrderLine[],
  items: RequestedItem[],
): { ok: true; lines: OrderLine[]; total: number } | { ok: false; unknownProductId: string } {
  const lines: OrderLine[] = [];
  for (const { productId, quantity } of items) {
    if (quantity <= 0) continue;
    const kept = existing.find((line) => line.productId === productId);
    if (kept) {
      lines.push({ productId: kept.productId, name: kept.name, unitPrice: kept.unitPrice, quantity });
      continue;
    }
    const menuItem = findMenuItem(productId);
    if (!menuItem) return { ok: false, unknownProductId: productId };
    lines.push({ productId, name: menuItem.name, unitPrice: menuItem.price, quantity });
  }
  return { ok: true, lines, total: lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0) };
}

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
