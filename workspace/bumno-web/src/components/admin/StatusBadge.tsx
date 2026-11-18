import { STATUS_LABELS } from "@/lib/orders/status";
import type { OrderStatus } from "@/lib/orders/types";

const tone: Record<OrderStatus, string> = {
  NEW: "text-rim-strong",
  CONFIRMED: "text-ink",
  DELIVERING: "text-ink",
  COMPLETED: "text-herb",
  CANCELLED: "text-chili",
};

const dot: Record<OrderStatus, string> = {
  NEW: "bg-rim",
  CONFIRMED: "border-2 border-ink/60",
  DELIVERING: "bg-ink",
  COMPLETED: "bg-herb",
  CANCELLED: "bg-chili",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex items-center gap-2 whitespace-nowrap text-[15px] font-medium ${tone[status]}`}>
      <span aria-hidden className={`size-2.5 rounded-full ${dot[status]}`} />
      {STATUS_LABELS[status]}
    </span>
  );
}
