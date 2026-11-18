import { ORDER_STATUSES, type OrderStatus } from "./types";

const NEXT: Record<OrderStatus, OrderStatus | null> = {
  NEW: "CONFIRMED",
  CONFIRMED: "DELIVERING",
  DELIVERING: "COMPLETED",
  COMPLETED: null,
  CANCELLED: null,
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: "Mới",
  CONFIRMED: "Đã xác nhận",
  DELIVERING: "Đang giao",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã huỷ",
};

export function nextStatus(from: OrderStatus): OrderStatus | null {
  return NEXT[from];
}

export function canCancel(from: OrderStatus): boolean {
  return NEXT[from] !== null;
}

/** Every step after `from` on NEW → CONFIRMED → DELIVERING → COMPLETED; the shop may skip ahead. */
export function laterStatuses(from: OrderStatus): OrderStatus[] {
  const later: OrderStatus[] = [];
  for (let next = NEXT[from]; next !== null; next = NEXT[next]) later.push(next);
  return later;
}

/** Forward by any number of steps, or cancel before completion; never back. */
export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (to === "CANCELLED") return canCancel(from);
  return laterStatuses(from).includes(to);
}

/** The shop can still fix the address and items until the order is out for delivery. */
export function canEdit(from: OrderStatus): boolean {
  return from === "NEW" || from === "CONFIRMED";
}

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}
