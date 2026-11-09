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

/** Label of the button that moves an order to the given status. */
export const ADVANCE_LABELS: Partial<Record<OrderStatus, string>> = {
  CONFIRMED: "Xác nhận đơn",
  DELIVERING: "Bắt đầu giao",
  COMPLETED: "Hoàn thành",
};

export function nextStatus(from: OrderStatus): OrderStatus | null {
  return NEXT[from];
}

export function canCancel(from: OrderStatus): boolean {
  return NEXT[from] !== null;
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (to === "CANCELLED") return canCancel(from);
  return NEXT[from] === to;
}

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}
