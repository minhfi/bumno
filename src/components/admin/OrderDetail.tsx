"use client";

import { useEffect, useRef, useState } from "react";
import { formatVnd } from "@/config/menu";
import { ApiError, apiRequest, isAbortError } from "@/lib/api-client";
import { formatSlot, slotDayLabel } from "@/lib/orders/slots";
import { ADVANCE_LABELS, canCancel, canEdit, nextStatus, STATUS_LABELS } from "@/lib/orders/status";
import type { OrderDetail as OrderDetailData, OrderStatus } from "@/lib/orders/types";
import { OrderEditForm, type OrderEdit } from "./OrderEditForm";

type Props = {
  code: string;
  onClose: () => void;
  onUpdated: (order: OrderDetailData) => void;
  onUnauthorized: () => void;
};

const STEPS: OrderStatus[] = ["NEW", "CONFIRMED", "DELIVERING", "COMPLETED"];

/** Where the order is in NEW → CONFIRMED → DELIVERING → COMPLETED; a cancelled order shows one line instead. */
function StatusTrack({ status }: { status: OrderStatus }) {
  if (status === "CANCELLED") {
    return (
      <p className="flex items-center gap-2 border-l-4 border-chili pl-3 font-semibold text-chili">{STATUS_LABELS.CANCELLED}</p>
    );
  }
  const current = STEPS.indexOf(status);
  return (
    <ol aria-label="Tiến trình đơn" className="grid grid-cols-4">
      {STEPS.map((step, index) => (
        <li
          key={step}
          aria-current={index === current ? "step" : undefined}
          className={`relative pt-5 text-[13px] leading-tight ${index <= current ? "font-semibold text-ink" : "text-ink/55"}`}
        >
          {index > 0 ? (
            <span aria-hidden className={`absolute right-1/2 top-[7px] h-0.5 w-full ${index <= current ? "bg-rim" : "bg-ink/15"}`} />
          ) : null}
          <span
            aria-hidden
            className={`absolute left-1/2 top-0 size-4 -translate-x-1/2 rounded-full ${
              index < current ? "bg-rim" : index === current ? "bg-rim ring-4 ring-rim/30" : "border-2 border-ink/25 bg-surface"
            }`}
          />
          <span className="block px-1 text-center">{STATUS_LABELS[step]}</span>
        </li>
      ))}
    </ol>
  );
}

type Load = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; order: OrderDetailData };

/** Order detail in a modal dialog: items, address, notes, status actions and the internal note. */
export function OrderDetail({ code, onClose, onUpdated, onUnauthorized }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const confirmCancelRef = useRef<HTMLButtonElement>(null);
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState<"status" | "note" | "edit" | null>(null);
  const [editing, setEditing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [note, setNote] = useState("");

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

  async function save(changes: { status?: OrderStatus; internalNote?: string } | OrderEdit, kind: "status" | "note" | "edit") {
    setSaving(kind);
    setActionError(null);
    setNotice(null);
    try {
      const order = await apiRequest<OrderDetailData>(`/api/admin/orders/${encodeURIComponent(code)}`, {
        method: "PATCH",
        body: changes,
      });
      setLoad({ status: "ready", order });
      if (kind === "note") setNote(order.internalNote ?? "");
      setConfirmCancel(false);
      if (kind !== "note") setEditing(false);
      setNotice("Đã cập nhật");
      onUpdated(order);
      // The clicked button may disappear after a status change; keep focus inside the dialog.
      if (kind !== "note") titleRef.current?.focus();
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
  const next = order ? nextStatus(order.status) : null;
  const nextLabel = next ? ADVANCE_LABELS[next] : undefined;
  const busy = saving !== null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="order-detail-title"
      className="m-0 ml-auto h-dvh max-h-dvh w-full max-w-lg overflow-y-auto scroll-pt-24 overscroll-contain bg-enamel p-0 text-ink backdrop:bg-ink/45 sm:border-l-4 sm:border-rim"
    >
      <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-ink/10 bg-enamel px-4 pb-3 pt-3 sm:px-5 sm:pb-4 sm:pt-5">
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
            {notice ? <p className="mt-1 font-medium text-herb">{notice}</p> : null}
            {actionError ? <p role="alert" className="mt-1 font-medium text-chili">{actionError}</p> : null}
          </div>
        </div>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className="min-h-11 sm:min-h-9 rounded-lg px-3 font-medium text-ink/70 hover:bg-ink/6 hover:text-ink"
        >
          Đóng
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
            <div className="space-y-4 sm:space-y-5">
              <StatusTrack status={order.status} />

              {next || canCancel(order.status) ? (
                <div className="flex flex-wrap items-center gap-3">
                  {next && nextLabel ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => save({ status: next }, "status")}
                      className="min-h-11 flex-1 rounded-lg bg-rim px-5 text-lg sm:min-h-10 sm:text-base font-semibold text-on-rim hover:bg-rim/90 disabled:opacity-60"
                    >
                      {saving === "status" ? "Đang lưu…" : nextLabel}
                    </button>
                  ) : null}
                  {canCancel(order.status) && !confirmCancel ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setConfirmCancel(true)}
                      className="min-h-11 rounded-lg px-4 font-semibold text-chili sm:min-h-10 hover:bg-chili/8 disabled:opacity-60"
                    >
                      Huỷ đơn
                    </button>
                  ) : null}
                  {confirmCancel ? (
                    <div className="flex w-full flex-wrap items-center gap-3 border-l-4 border-chili bg-chili/8 p-3">
                      <span className="font-medium">Huỷ đơn {order.code}?</span>
                      <button
                        ref={confirmCancelRef}
                        type="button"
                        disabled={busy}
                        onClick={() => save({ status: "CANCELLED" }, "status")}
                        className="min-h-11 sm:min-h-9 rounded-lg bg-chili px-4 font-semibold text-enamel disabled:opacity-60"
                      >
                        Xác nhận huỷ
                      </button>
                      <button type="button" onClick={() => setConfirmCancel(false)} className="min-h-11 sm:min-h-9 rounded-lg px-3 font-medium hover:bg-ink/6">
                        Không
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}

            </div>

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
                <section aria-labelledby="customer-title" className="border-t border-ink/10 pt-4 sm:pt-5">
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
                        setNotice(null);
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
                  <p className="mt-2 flex items-baseline gap-2 border-t border-ink/10 pt-2 sm:mt-3 sm:pt-3">
                    <span className="font-semibold">Tổng</span>
                    <span aria-hidden className="flex-1" />
                    <span className="font-display text-2xl font-extrabold tabular-nums">{formatVnd(order.total)}</span>
                  </p>
                </section>

              </>
            )}

            <form
              className="border-t border-ink/10 pt-4 sm:pt-5"
              onSubmit={(event) => {
                event.preventDefault();
                void save({ internalNote: note }, "note");
              }}
            >
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
                  setNotice(null);
                }}
                className="mt-2 block h-[4.5rem] w-full rounded-lg border border-ink/20 bg-surface px-3 py-2 focus:border-rim-strong sm:h-auto"
              />
              <button
                type="submit"
                disabled={busy || note === (order.internalNote ?? "")}
                className="mt-2 min-h-10 rounded-lg bg-ink px-4 sm:min-h-9 font-semibold text-enamel hover:bg-ink/85 disabled:bg-ink/25 disabled:text-ink/60"
              >
                {saving === "note" ? "Đang lưu…" : "Lưu ghi chú"}
              </button>
            </form>
          </>
        ) : null}
      </div>
    </dialog>
  );
}
