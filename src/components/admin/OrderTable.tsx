import { formatVnd } from "@/config/menu";
import { formatSlot } from "@/lib/orders/slots";
import type { OrderSummary } from "@/lib/orders/types";
import { StatusBadge } from "./StatusBadge";

type Props = { orders: OrderSummary[]; onOpen: (code: string) => void };

export function OrderTable({ orders, onOpen }: Props) {
  return (
    <table className="w-full border-collapse text-left text-[15px] tabular-nums">
      <caption className="sr-only">Danh sách đơn hàng</caption>
      <thead className="border-b border-ink/15 text-sm text-ink/70">
        <tr>
          <th scope="col" className="py-2 pr-3 font-medium">Mã</th>
          <th scope="col" className="py-2 pr-3 font-medium">Đặt lúc</th>
          <th scope="col" className="py-2 pr-3 font-medium">Khách</th>
          <th scope="col" className="py-2 pr-3 font-medium">SĐT</th>
          <th scope="col" className="py-2 pr-3 font-medium">Nhận</th>
          <th scope="col" className="py-2 pr-3 text-right font-medium">Tổng</th>
          <th scope="col" className="py-2 font-medium">Trạng thái</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr key={order.code} className={`border-b border-ink/10 ${order.status === "NEW" ? "bg-rim/6" : ""}`}>
            <td className="py-2.5 pr-3">
              <button
                type="button"
                onClick={() => onOpen(order.code)}
                className="font-semibold text-rim-strong underline-offset-4 hover:underline"
              >
                <span className="sr-only">Xem đơn </span>
                {order.code}
              </button>
            </td>
            <td className="py-2.5 pr-3">{formatSlot(order.createdAt)}</td>
            <td className="max-w-[16ch] truncate py-2.5 pr-3" title={order.customerName}>{order.customerName}</td>
            <td className="py-2.5 pr-3">
              <a href={`tel:${order.phone}`} className="underline-offset-4 hover:underline">
                {order.phone}
              </a>
            </td>
            <td className="py-2.5 pr-3">{formatSlot(order.deliverySlot)}</td>
            <td className="py-2.5 pr-3 text-right">{formatVnd(order.total)}</td>
            <td className="py-2.5">
              <StatusBadge status={order.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
