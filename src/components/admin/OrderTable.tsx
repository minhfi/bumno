import { formatVnd } from "@/config/menu";
import { formatSlot, slotDayLabel } from "@/lib/orders/slots";
import type { OrderSummary } from "@/lib/orders/types";
import { isClosedOrder, rowAccentClass, rowOpenButtonClass } from "./order-row";
import { StatusBadge } from "./StatusBadge";

type Props = { orders: OrderSummary[]; onOpen: (code: string) => void };

/** Desktop list: one ticket per row, led by the delivery time. The whole row opens the order. */
export function OrderTable({ orders, onOpen }: Props) {
  const now = new Date();
  return (
    <table className="w-full border-collapse text-left tabular-nums">
      <caption className="sr-only">Danh sách đơn hàng</caption>
      <thead className="text-sm text-ink/65">
        <tr>
          <th scope="col" className="w-36 py-2 pl-6 pr-4 font-medium">Giờ nhận</th>
          <th scope="col" className="py-2 pr-4 font-medium">Đơn</th>
          <th scope="col" className="py-2 pr-4 font-medium">Khách</th>
          <th scope="col" className="py-2 pr-4 text-right font-medium">Tổng</th>
          <th scope="col" className="w-40 py-2 pr-6 font-medium">Trạng thái</th>
        </tr>
      </thead>
      <tbody className="bg-surface">
        {orders.map((order) => (
          <tr
            key={order.code}
            className={`relative border-t border-ink/10 hover:bg-ink/[0.03] ${rowAccentClass(order.status)} ${
              isClosedOrder(order.status) ? "text-ink/65" : ""
            }`}
          >
            <td className="py-3.5 pl-6 pr-4 align-top">
              <span className="block font-display text-[40px] font-extrabold leading-none text-ink">
                {formatSlot(order.deliverySlot)}
              </span>
              <span className="mt-1 block text-sm text-ink/65">{slotDayLabel(order.deliverySlot, now)}</span>
            </td>
            <td className="py-3.5 pr-4 align-top">
              <button
                type="button"
                onClick={() => onOpen(order.code)}
                className={`font-display text-xl font-bold tracking-wide text-ink ${rowOpenButtonClass}`}
              >
                <span className="sr-only">Xem đơn </span>
                {order.code}
              </button>
              <span className="block text-sm text-ink/65">Đặt lúc {formatSlot(order.createdAt)}</span>
            </td>
            <td className="max-w-[24ch] py-3.5 pr-4 align-top">
              <span className="block truncate font-medium" title={order.customerName}>
                {order.customerName}
              </span>
              <a href={`tel:${order.phone}`} className="relative z-10 text-[15px] text-ink/75 underline-offset-4 hover:underline">
                {order.phone}
              </a>
            </td>
            <td className="py-3.5 pr-4 text-right align-top font-display text-xl font-bold">{formatVnd(order.total)}</td>
            <td className="py-3.5 pr-6 align-top">
              <StatusBadge status={order.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
