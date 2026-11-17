import { formatVnd } from "@/config/menu";
import { formatSlot, slotDayLabel } from "@/lib/orders/slots";
import type { OrderSummary } from "@/lib/orders/types";
import { StatusBadge } from "./StatusBadge";

type Props = { order: OrderSummary; onOpen: (code: string) => void };

/** Mobile ticket of one order: delivery time on the left, the rest beside it. The whole ticket opens the order. */
export function OrderCard({ order, onOpen }: Props) {
  const done = order.status === "CANCELLED" || order.status === "COMPLETED";
  return (
    <li
      className={`relative grid grid-cols-[4.75rem_1fr] gap-x-3 border-t border-ink/10 bg-surface py-3.5 pl-4 pr-4 ${
        order.status === "NEW" ? "shadow-[inset_4px_0_0_var(--rim)]" : ""
      } ${done ? "text-ink/55" : ""}`}
    >
      <div>
        <span className="block font-display text-[30px] font-extrabold leading-none tabular-nums text-ink">
          {formatSlot(order.deliverySlot)}
        </span>
        <span className="mt-1 block text-sm text-ink/65">{slotDayLabel(order.deliverySlot, new Date())}</span>
      </div>
      <div className="min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <button
            type="button"
            onClick={() => onOpen(order.code)}
            className="font-display text-lg font-bold tracking-wide text-ink after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:outline-3 focus-visible:after:-outline-offset-3 focus-visible:after:outline-rim-strong"
          >
            <span className="sr-only">Xem đơn </span>
            {order.code}
          </button>
          <StatusBadge status={order.status} />
        </div>
        <div className="mt-1 flex items-baseline justify-between gap-3">
          <span className="min-w-0 truncate font-medium" title={order.customerName}>
            {order.customerName}
          </span>
          <span className="shrink-0 font-display text-lg font-bold tabular-nums">{formatVnd(order.total)}</span>
        </div>
        <a
          href={`tel:${order.phone}`}
          className="relative z-10 text-[15px] tabular-nums text-ink/75 underline underline-offset-4"
        >
          {order.phone}
        </a>
      </div>
    </li>
  );
}
