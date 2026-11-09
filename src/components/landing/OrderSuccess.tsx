import { formatVnd } from "@/config/menu";
import { formatSlot } from "@/lib/orders/slots";
import type { CreateOrderResponse } from "@/lib/orders/types";

type Props = { order: CreateOrderResponse; onNewOrder: () => void };

export function OrderSuccess({ order, onNewOrder }: Props) {
  return (
    <div className="rounded-3xl border-4 border-herb bg-surface p-6 sm:p-8">
      <h3 tabIndex={-1} id="order-success-title" className="font-display text-[40px] font-extrabold leading-tight text-herb">
        Đã đặt đơn {order.code}
      </h3>
      <p className="mt-2 text-lg">Quán sẽ gọi cho bạn để xác nhận. Giờ nhận dự kiến: {formatSlot(order.deliverySlot)}.</p>
      <ul className="mt-6 divide-y divide-ink/10 border-y border-ink/10">
        {order.items.map((item) => (
          <li key={item.name} className="flex justify-between gap-4 py-3">
            <span>
              {item.name} × {item.quantity}
            </span>
            <span className="tabular-nums">{formatVnd(item.unitPrice * item.quantity)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex justify-between text-lg font-semibold">
        <span>Tổng (trả khi nhận hàng)</span>
        <span className="tabular-nums">{formatVnd(order.total)}</span>
      </p>
      <button
        type="button"
        onClick={onNewOrder}
        className="mt-6 min-h-12 rounded-full border-2 border-rim-strong px-6 font-semibold text-rim-strong hover:bg-rim hover:text-on-rim"
      >
        Đặt đơn khác
      </button>
    </div>
  );
}
