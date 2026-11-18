import type { OrderStatus } from "@/lib/orders/types";

/** Makes a row's main button cover the whole row, with the focus ring drawn around the row. */
export const rowOpenButtonClass =
  "after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:outline-3 focus-visible:after:-outline-offset-3 focus-visible:after:outline-rim-strong";

/** Orders that need nothing more from the shop are shown muted. */
export function isClosedOrder(status: OrderStatus): boolean {
  return status === "CANCELLED" || status === "COMPLETED";
}

/** Plate-rim accent on the left edge of an order that has not been looked at yet. */
export function rowAccentClass(status: OrderStatus): string {
  return status === "NEW" ? "shadow-[inset_4px_0_0_var(--rim)]" : "";
}
