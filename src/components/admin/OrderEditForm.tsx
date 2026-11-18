"use client";

import { useEffect, useState, type FormEvent } from "react";
import { formatVnd, menu } from "@/config/menu";
import { fieldErrors, MAX_ADDRESS_LENGTH, MAX_QUANTITY, updateOrderSchema } from "@/lib/orders/schema";
import type { OrderDetail } from "@/lib/orders/types";

export type OrderEdit = { address: string; items: { productId: string; quantity: number }[] };

type Props = {
  order: OrderDetail;
  saving: boolean;
  onSave: (edit: OrderEdit) => void;
  onCancel: () => void;
};

type Row = { productId: string; name: string; unitPrice: number; quantity: number };

/** Lines already in the order keep their price; the other menu items are offered at the menu price. */
function startRows(order: OrderDetail): Row[] {
  const inOrder = new Set(order.items.map((item) => item.productId));
  const others = menu.filter((item) => !inOrder.has(item.id)).map((item) => ({ productId: item.id, name: item.name, unitPrice: item.price, quantity: 0 }));
  return [...order.items.map(({ productId, name, unitPrice, quantity }) => ({ productId, name, unitPrice, quantity })), ...others];
}

const stepperClass =
  "grid size-11 place-items-center rounded-lg border border-ink/20 bg-surface text-xl font-semibold hover:bg-ink/6 disabled:opacity-35";

/** Edit mode of the order drawer: address and item quantities. Saving is done by the parent. */
export function OrderEditForm({ order, saving, onSave, onCancel }: Props) {
  const [address, setAddress] = useState(order.address);
  const [rows, setRows] = useState(() => startRows(order));
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Opening the form moves focus to the first field, since the button that opened it is gone.
  useEffect(() => {
    document.getElementById("edit-address")?.focus();
  }, []);

  const total = rows.reduce((sum, row) => sum + row.unitPrice * row.quantity, 0);

  function changeQuantity(productId: string, delta: number) {
    setRows((current) =>
      current.map((row) =>
        row.productId === productId ? { ...row, quantity: Math.min(MAX_QUANTITY, Math.max(0, row.quantity + delta)) } : row,
      ),
    );
    if (errors.items) setErrors((current) => ({ ...current, items: "" }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const edit: OrderEdit = { address, items: rows.map(({ productId, quantity }) => ({ productId, quantity })) };
    const parsed = updateOrderSchema.safeParse(edit);
    if (!parsed.success) {
      const next = fieldErrors(parsed.error);
      setErrors(next);
      document.getElementById(next.address ? "edit-address" : "edit-items-legend")?.focus();
      return;
    }
    setErrors({});
    onSave(edit);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6 border-t border-ink/10 pt-5">
      <div>
        <p className="text-lg font-semibold">{order.customerName}</p>
        <a href={`tel:${order.phone}`} className="inline-block text-lg tabular-nums text-rim-strong underline underline-offset-4">
          {order.phone}
        </a>
      </div>

      <div>
        <label htmlFor="edit-address" className="font-semibold">
          Địa chỉ giao
        </label>
        <textarea
          id="edit-address"
          rows={3}
          maxLength={MAX_ADDRESS_LENGTH}
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            if (errors.address) setErrors((current) => ({ ...current, address: "" }));
          }}
          name="address"
          autoComplete="off"
          aria-invalid={Boolean(errors.address)}
          aria-describedby={errors.address ? "edit-address-error" : undefined}
          className="mt-2 block w-full rounded-lg border border-ink/20 bg-surface px-3 py-2 focus:border-rim-strong aria-[invalid=true]:border-chili"
        />
        {errors.address ? (
          <p id="edit-address-error" role="alert" className="mt-1.5 text-sm font-medium text-chili">
            {errors.address}
          </p>
        ) : null}
      </div>

      <fieldset aria-describedby={errors.items ? "edit-items-error" : undefined}>
        <legend id="edit-items-legend" tabIndex={-1} className="font-semibold">
          Món
        </legend>
        <ul className="mt-3 space-y-3">
          {rows.map((row) => (
            <li key={row.productId} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">{row.name}</p>
                <p className="text-sm tabular-nums text-ink/65">{formatVnd(row.unitPrice)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  aria-label={`Bớt 1 ${row.name}`}
                  disabled={row.quantity === 0}
                  onClick={() => changeQuantity(row.productId, -1)}
                  className={stepperClass}
                >
                  <span aria-hidden>−</span>
                </button>
                <span className="w-8 text-center text-lg font-semibold tabular-nums">
                  {row.quantity}
                </span>
                <button
                  type="button"
                  aria-label={`Thêm 1 ${row.name}`}
                  disabled={row.quantity >= MAX_QUANTITY}
                  onClick={() => changeQuantity(row.productId, 1)}
                  className={stepperClass}
                >
                  <span aria-hidden>+</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
        {errors.items ? (
          <p id="edit-items-error" role="alert" className="mt-2 text-sm font-medium text-chili">
            {errors.items}
          </p>
        ) : null}
        <p role="status" className="mt-4 flex items-baseline gap-2 border-t border-ink/10 pt-3">
          <span className="font-semibold">Tổng tạm tính</span>
          <span aria-hidden className="flex-1" />
          <span className="font-display text-2xl font-extrabold tabular-nums">{formatVnd(total)}</span>
        </p>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="min-h-12 flex-1 rounded-lg bg-rim px-5 text-lg sm:min-h-10 sm:text-base font-semibold text-on-rim hover:bg-rim/90 disabled:opacity-60"
        >
          {saving ? "Đang lưu…" : "Lưu thay đổi"}
        </button>
        <button type="button" onClick={onCancel} className="min-h-12 rounded-lg px-4 font-medium sm:min-h-10 hover:bg-ink/6">
          Bỏ qua
        </button>
      </div>
    </form>
  );
}
