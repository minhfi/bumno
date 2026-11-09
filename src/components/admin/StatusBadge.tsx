import { STATUS_LABELS } from "@/lib/orders/status";
import type { OrderStatus } from "@/lib/orders/types";

const tone: Record<OrderStatus, string> = {
  NEW: "bg-rim/25 text-ink",
  CONFIRMED: "bg-ink/8 text-ink",
  DELIVERING: "bg-ink/15 text-ink",
  COMPLETED: "bg-herb/15 text-herb",
  CANCELLED: "bg-chili/12 text-chili",
};

const dot: Record<OrderStatus, string> = {
  NEW: "bg-rim",
  CONFIRMED: "bg-ink/45",
  DELIVERING: "bg-ink",
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
