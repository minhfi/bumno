"use client";

import { useEffect, useRef, useState } from "react";
import { formatVnd } from "@/config/menu";
import { ApiError, apiRequest, isAbortError } from "@/lib/api-client";
import { formatSlot, slotDayLabel } from "@/lib/orders/slots";
import { MAX_SHIPPING_FEE } from "@/lib/orders/schema";
import { canCancel, canChangeShippingFee, canEdit, isOrderStatus, laterStatuses, STATUS_LABELS } from "@/lib/orders/status";
import type { OrderDetail as OrderDetailData, OrderStatus } from "@/lib/orders/types";
import { OrderEditForm, type OrderEdit } from "./OrderEditForm";

type Props = {
  code: string;
  onClose: () => void;
  onUpdated: (order: OrderDetailData) => void;
  onUnauthorized: () => void;
};

/** The current status, every later step and "Đã huỷ" while it is still allowed: what the server accepts. */
function statusChoices(status: OrderStatus): OrderStatus[] {
  return [status, ...laterStatuses(status), ...(canCancel(status) ? (["CANCELLED"] as const) : [])];
}

const feeFormat = new Intl.NumberFormat("vi-VN");
/** As many digits as the maximum has; a larger number of that length shows the error instead of being cut off. */
const MAX_FEE_DIGITS = String(MAX_SHIPPING_FEE).length;

/** Digits typed into the fee field, with thousands separators; empty stays empty. */
function formatFeeInput(value: string): string {
  const digits = value.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, MAX_FEE_DIGITS);
  return digits === "" ? "" : feeFormat.format(Number(digits));
}

/** Empty means 0. */
function parseFeeInput(value: string): number {
  const digits = value.replace(/\D/g, "");
  return digits === "" ? 0 : Number(digits);
}

const feeText = (fee: number) => (fee > 0 ? feeFormat.format(fee) : "");

type OrderChanges = { status?: OrderStatus; internalNote?: string; shippingFee?: number };

type Load = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; order: OrderDetailData };

/** Order detail in a modal dialog: status, customer, items, and one form for the status, shipping fee and internal note. */
export function OrderDetail({ code, onClose, onUpdated, onUnauthorized }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const confirmCancelRef = useRef<HTMLButtonElement>(null);
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState<"order" | "edit" | null>(null);
  const [editing, setEditing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [note, setNote] = useState("");
  const [fee, setFee] = useState("");
  const [statusChoice, setStatusChoice] = useState<OrderStatus | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    apiRequest<OrderDetailData>(`/api/admin/orders/${encodeURIComponent(code)}`, { signal: controller.signal })
      .then((order) => {
        setLoad({ status: "ready", order });
        setNote(order.internalNote ?? "");
        setFee(feeText(order.shippingFee));
        setStatusChoice(order.status);
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) return;
        if (error instanceof ApiError && error.status === 401) return onUnauthorized();
        setLoad({ status: "error", message: error instanceof ApiError ? error.message : "Không tải được đơn hàng." });
      });
    return () => controller.abort();
  }, [code, attempt, onUnauthorized]);

  useEffect(() => {
    if (confirmCancel) confirmCancelRef.current?.focus();
  }, [confirmCancel]);

  async function save(changes: OrderChanges | OrderEdit, kind: "order" | "edit") {
    setSaving(kind);
    setActionError(null);
    try {
      const order = await apiRequest<OrderDetailData>(`/api/admin/orders/${encodeURIComponent(code)}`, {
        method: "PATCH",
        body: changes,
      });
      setLoad({ status: "ready", order });
      setNote(order.internalNote ?? "");
      setFee(feeText(order.shippingFee));
      setStatusChoice(order.status);
      setConfirmCancel(false);
      setEditing(false);
      onUpdated(order);
      // The form may change or disappear (a cancelled order); keep focus inside the dialog.
      if (kind === "edit" || "status" in changes) titleRef.current?.focus();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return onUnauthorized();
      setActionError(error instanceof ApiError ? error.message : "Có lỗi xảy ra. Vui lòng thử lại.");
      // Someone else changed the order meanwhile: show what it looks like now.
      if (error instanceof ApiError && (error.code === "NOT_EDITABLE" || error.code === "INVALID_TRANSITION")) {
        setEditing(false);
        setAttempt((n) => n + 1);
      }
    } finally {
      setSaving(null);
    }
  }

  const order = load.status === "ready" ? load.order : null;
  const busy = saving !== null;
  const chosenStatus = statusChoice ?? order?.status ?? null;
  const statusChanged = order !== null && chosenStatus !== null && chosenStatus !== order.status;
  const noteChanged = order !== null && note !== (order.internalNote ?? "");
  const feeValue = parseFeeInput(fee);
  const feeChanged = order !== null && feeValue !== order.shippingFee;
  const feeTooLarge = feeValue > MAX_SHIPPING_FEE;
  const hasChanges = statusChanged || noteChanged || feeChanged;

  /** Saves the status, shipping fee and note in one request; moving to "Đã huỷ" asks first. */
  function submitOrder(confirmed = false) {
    if (!order || !chosenStatus || !hasChanges || feeTooLarge) return;
    if (statusChanged && chosenStatus === "CANCELLED" && !confirmed) {
      setConfirmCancel(true);
      return;
    }
    void save(
      {
        ...(statusChanged ? { status: chosenStatus } : {}),
        ...(feeChanged ? { shippingFee: feeValue } : {}),
        ...(noteChanged ? { internalNote: note } : {}),
      },
      "order",
    );
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="order-detail-title"
      className="m-0 ml-auto h-dvh max-h-dvh w-full max-w-lg overflow-y-auto scroll-pt-24 overscroll-contain bg-enamel p-0 text-ink backdrop:bg-ink/45 sm:border-l-4 sm:border-rim"
    >
      <div className="sticky top-0 z-20 flex items-start justify-between gap-3 border-b border-ink/10 bg-enamel px-4 pb-3 pt-3 sm:px-5 sm:pb-4 sm:pt-5">
        <div>
          <h2
            ref={titleRef}
            tabIndex={-1}
            id="order-detail-title"
            className="font-display text-[26px] font-extrabold sm:text-[32px] leading-none tracking-wide focus:outline-none"
          >
            <span className="sr-only">Đơn </span>
            {code}
          </h2>
          {order ? (
            <p className="mt-1 text-[15px] text-ink/75 tabular-nums sm:mt-1.5">
              Nhận <span className="font-semibold text-ink">{formatSlot(order.deliverySlot)} {slotDayLabel(order.deliverySlot, new Date())}</span>
              , đặt lúc {formatSlot(order.createdAt)}
            </p>
          ) : null}
          <div aria-live="polite" className="empty:hidden">
            {actionError ? <p role="alert" className="mt-1 font-medium text-chili">{actionError}</p> : null}
          </div>
        </div>
        <button
          type="button"
          aria-label="Đóng"
          onClick={() => dialogRef.current?.close()}
          className="-mr-2 grid size-10 shrink-0 place-items-center rounded-lg text-ink/70 hover:bg-ink/6 hover:text-ink sm:size-9"
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5 fill-none stroke-current stroke-2">
            <path d="m5 5 10 10M15 5 5 15" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="space-y-5 px-4 py-4 sm:space-y-7 sm:px-5 sm:py-6">
        {load.status === "loading" ? <p role="status" className="text-ink/70">Đang tải đơn…</p> : null}
        {load.status === "error" ? (
          <div role="alert" className="border-l-4 border-chili bg-chili/8 px-4 py-3 text-chili">
            <p>{load.message}</p>
            <button type="button" onClick={() => setAttempt((n) => n + 1)} className="mt-2 min-h-11 sm:min-h-9 font-semibold underline underline-offset-4">
              Thử lại
            </button>
          </div>
        ) : null}

        {order ? (
          <>
            {editing ? (
              <OrderEditForm
                order={order}
                saving={saving === "edit"}
                onSave={(edit) => void save(edit, "edit")}
                onCancel={() => {
                  setEditing(false);
                  setActionError(null);
                }}
              />
            ) : (
              <>
                <section aria-labelledby="customer-title" className="border-t border-ink/10 pt-4 first:border-t-0 first:pt-0 sm:pt-5">
                  <h3 id="customer-title" className="sr-only">Khách hàng</h3>
                  <p className="text-lg font-semibold">{order.customerName}</p>
                  <a href={`tel:${order.phone}`} className="mt-0.5 inline-block text-lg tabular-nums text-rim-strong underline underline-offset-4">
                    {order.phone}
                  </a>
                  <p className="mt-2 break-words">{order.address}</p>
                  {order.note ? (
                    <div className="mt-3 border-l-4 border-rim/60 pl-3">
                      <p className="text-sm text-ink/65">Ghi chú của khách</p>
                      <p className="whitespace-pre-line break-words text-ink/85">{order.note}</p>
                    </div>
                  ) : null}
                  {canEdit(order.status) ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(true);
                        setActionError(null);
                        setConfirmCancel(false);
                      }}
                      className="mt-3 min-h-10 rounded-lg border sm:mt-4 sm:min-h-9 border-ink/20 px-4 font-semibold hover:bg-ink/6"
                    >
                      Sửa địa chỉ và món
                    </button>
                  ) : null}
                </section>

                <section aria-labelledby="items-title" className="border-t border-ink/10 pt-4 sm:pt-5">
                  <h3 id="items-title" className="font-semibold">Món</h3>
                  <ul className="mt-2 space-y-1.5 tabular-nums sm:mt-3 sm:space-y-2">
                    {order.items.map((item) => (
                      <li key={item.productId} className="flex items-baseline gap-2">
                        <span>
                          {item.name} <span className="text-ink/65">× {item.quantity}</span>
                        </span>
                        <span aria-hidden className="mb-1 flex-1 border-b-2 border-dotted border-ink/20" />
                        <span>{formatVnd(item.unitPrice * item.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                  {order.shippingFee > 0 ? (
                    <p className="mt-1.5 flex items-baseline gap-2 tabular-nums sm:mt-2">
                      <span>Phí ship</span>
                      <span aria-hidden className="mb-1 flex-1 border-b-2 border-dotted border-ink/20" />
                      <span>{formatVnd(order.shippingFee)}</span>
                    </p>
                  ) : null}
                  <p className="mt-2 flex items-baseline gap-2 border-t border-ink/10 pt-2 sm:mt-3 sm:pt-3">
                    <span className="font-semibold">Tổng</span>
                    <span aria-hidden className="flex-1" />
                    <span className="font-display text-2xl font-extrabold tabular-nums">{formatVnd(order.total)}</span>
                  </p>
                </section>

              </>
            )}

            {/* While the address and items are being edited, that form's buttons are the only ones. */}
            {!editing ? (
              <form
                className="space-y-3 border-t border-ink/10 pt-4 sm:pt-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  submitOrder();
                }}
              >
                <div>
                  <label htmlFor="order-status" className="font-semibold">
                    Trạng thái
                  </label>
                  <select
                    id="order-status"
                    value={chosenStatus ?? order.status}
                    disabled={busy || statusChoices(order.status).length === 1}
                    onChange={(e) => {
                      if (isOrderStatus(e.target.value)) setStatusChoice(e.target.value);
                      setConfirmCancel(false);
                    }}
                    className="mt-2 block min-h-10 w-full rounded-lg border border-ink/20 bg-surface px-3 focus:border-rim-strong disabled:opacity-60 sm:min-h-9 sm:text-sm"
                  >
                    {statusChoices(order.status).map((status) => (
                      <option key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="shipping-fee" className="font-semibold">
                    Phí ship<span className="sr-only"> (đồng)</span>
                  </label>
                  <div className="relative mt-2">
                    <input
                      id="shipping-fee"
                      name="shippingFee"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="0"
                      value={fee}
                      disabled={busy || !canChangeShippingFee(order.status)}
                      aria-invalid={feeTooLarge || undefined}
                      aria-describedby={feeTooLarge ? "shipping-fee-error" : undefined}
                      onChange={(e) => setFee(formatFeeInput(e.target.value))}
                      className="block min-h-10 w-full rounded-lg border border-ink/20 bg-surface py-0 pl-3 pr-8 tabular-nums focus:border-rim-strong disabled:opacity-60 aria-invalid:border-chili sm:min-h-9 sm:text-sm"
                    />
                    <span aria-hidden className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-ink/65 sm:text-sm">
                      đ
                    </span>
                  </div>
                  {feeTooLarge ? (
                    <p id="shipping-fee-error" role="alert" className="mt-1 text-sm font-medium text-chili">
                      Phí ship tối đa {formatVnd(MAX_SHIPPING_FEE)}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="internal-note" className="font-semibold">
                    Ghi chú nội bộ
                  </label>
                  <textarea
                    id="internal-note"
                    rows={3}
                    maxLength={1000}
                    value={note}
                    onChange={(e) => {
                      setNote(e.target.value);
                    }}
                    className="mt-2 block h-[4.5rem] w-full rounded-lg border border-ink/20 bg-surface px-3 py-2 focus:border-rim-strong sm:h-auto"
                  />
                </div>

                {confirmCancel ? (
                  <div className="flex flex-wrap items-center gap-2 border-l-4 border-chili bg-chili/8 p-3">
                    <span className="mr-auto font-medium">Huỷ đơn {order.code}?</span>
                    <button
                      ref={confirmCancelRef}
                      type="button"
                      disabled={busy}
                      onClick={() => submitOrder(true)}
                      className="min-h-10 rounded-lg bg-chili px-4 text-[15px] font-semibold text-enamel disabled:opacity-60 sm:min-h-9 sm:text-sm"
                    >
                      Xác nhận huỷ
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmCancel(false);
                        setStatusChoice(order.status);
                      }}
                      className="min-h-10 rounded-lg px-3 text-[15px] font-medium hover:bg-ink/6 sm:min-h-9 sm:text-sm"
                    >
                      Không
                    </button>
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={busy || !hasChanges || feeTooLarge}
                    className="min-h-10 rounded-lg bg-rim px-5 text-[15px] font-semibold text-on-rim hover:bg-rim/90 disabled:bg-ink/15 disabled:text-ink/50 sm:min-h-9 sm:text-sm"
                  >
                    {saving === "order" ? "Đang lưu…" : "Lưu"}
                  </button>
                )}
              </form>
            ) : null}
          </>
        ) : null}
      </div>
    </dialog>
  );
}
