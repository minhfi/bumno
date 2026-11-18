import { formatVnd } from "@/config/menu";
import { formatSlot, slotDayLabel } from "@/lib/orders/slots";
import type { OrderSummary } from "@/lib/orders/types";
import { isClosedOrder, rowAccentClass, rowOpenButtonClass } from "./order-row";
import { StatusBadge } from "./StatusBadge";

type Props = { order: OrderSummary; onOpen: (code: string) => void };

/** Mobile ticket of one order: delivery time on the left; code, phone and status, then name and total beside it. The whole ticket opens the order. */
export function OrderCard({ order, onOpen }: Props) {
  return (
    <li
      className={`relative grid grid-cols-[4.25rem_1fr] gap-x-3 border-t border-ink/10 bg-surface py-2.5 pl-4 pr-4 ${rowAccentClass(
        order.status,
      )} ${isClosedOrder(order.status) ? "text-ink/65" : ""}`}
    >
      <div>
        <span className="block font-display text-[28px] font-extrabold leading-none tabular-nums text-ink">
          {formatSlot(order.deliverySlot)}
        </span>
        <span className="mt-0.5 block text-xs text-ink/65">{slotDayLabel(order.deliverySlot, new Date())}</span>
      </div>
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-baseline gap-2">
            <button
              type="button"
              onClick={() => onOpen(order.code)}
              className={`shrink-0 font-display text-base font-bold tracking-wide text-ink ${rowOpenButtonClass}`}
            >
              <span className="sr-only">Xem đơn </span>
              {order.code}
            </button>
            <a
              href={`tel:${order.phone}`}
              className="relative z-10 truncate text-sm tabular-nums text-ink/75 underline underline-offset-4"
            >
              {order.phone}
            </a>
          </span>
          <StatusBadge status={order.status} />
        </div>
        <div className="mt-1 flex items-baseline justify-between gap-3">
          <span className="min-w-0 truncate font-medium" title={order.customerName}>
            {order.customerName}
          </span>
          <span className="shrink-0 font-display text-lg font-bold tabular-nums">{formatVnd(order.total)}</span>
        </div>
      </div>
    </li>
  );
}
