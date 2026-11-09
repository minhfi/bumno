import { STATUS_LABELS } from "@/lib/orders/status";
import type { OrderStatus } from "@/lib/orders/types";

const tone: Record<OrderStatus, string> = {
  NEW: "bg-rim/12 text-rim",
  CONFIRMED: "bg-fish-sauce/15 text-ink",
  DELIVERING: "bg-fish-sauce/30 text-ink",
  COMPLETED: "bg-herb/15 text-herb",
  CANCELLED: "bg-chili/12 text-chili",
};

const dot: Record<OrderStatus, string> = {
  NEW: "bg-rim",
  CONFIRMED: "bg-fish-sauce",
  DELIVERING: "bg-fish-sauce",
  COMPLETED: "bg-herb",
  CANCELLED: "bg-chili",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-sm font-medium ${tone[status]}`}>
      <span aria-hidden className={`size-2 rounded-full ${dot[status]}`} />
      {STATUS_LABELS[status]}
    </span>
  );
}
