import { formatVnd } from "@/config/menu";
import { formatSlot } from "@/lib/orders/slots";
import type { OrderSummary } from "@/lib/orders/types";
import { StatusBadge } from "./StatusBadge";

type Props = { order: OrderSummary; onOpen: (code: string) => void };

/** Mobile layout of one order row. */
export function OrderCard({ order, onOpen }: Props) {
  return (
    <li className={`rounded-xl border border-ink/12 p-4 ${order.status === "NEW" ? "bg-rim/6" : "bg-surface"}`}>
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={() => onOpen(order.code)} className="text-left">
          <span className="block font-semibold text-rim">
            <span className="sr-only">Xem đơn </span>
            {order.code}
          </span>
          <span className="block text-sm text-ink/70 tabular-nums">
            Đặt {formatSlot(order.createdAt)} · Nhận {formatSlot(order.deliverySlot)}
          </span>
        </button>
        <StatusBadge status={order.status} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 text-[15px]">
        <span className="flex min-w-0 items-baseline gap-1.5">
          <span className="min-w-0 truncate" title={order.customerName}>
            {order.customerName}
          </span>
          <a href={`tel:${order.phone}`} className="shrink-0 text-rim underline underline-offset-4">
            {order.phone}
          </a>
        </span>
        <span className="shrink-0 font-semibold tabular-nums">{formatVnd(order.total)}</span>
      </div>
    </li>
  );
}
