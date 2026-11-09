"use client";

import { useEffect, useRef, useState } from "react";
import { formatVnd } from "@/config/menu";
import { ApiError, apiRequest, isAbortError } from "@/lib/api-client";
import { formatSlot } from "@/lib/orders/slots";
import { ADVANCE_LABELS, canCancel, nextStatus } from "@/lib/orders/status";
import type { OrderDetail as OrderDetailData, OrderStatus } from "@/lib/orders/types";
import { StatusBadge } from "./StatusBadge";

type Props = {
  code: string;
  onClose: () => void;
  onUpdated: (order: OrderDetailData) => void;
  onUnauthorized: () => void;
};

type Load = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; order: OrderDetailData };

/** Order detail in a modal dialog: items, address, notes, status actions and the internal note. */
export function OrderDetail({ code, onClose, onUpdated, onUnauthorized }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const confirmCancelRef = useRef<HTMLButtonElement>(null);
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState<"status" | "note" | null>(null);
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

  async function save(changes: { status?: OrderStatus; internalNote?: string }, kind: "status" | "note") {
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
      setNotice("Đã cập nhật");
      onUpdated(order);
      // The clicked button may disappear after a status change; keep focus inside the dialog.
      if (kind === "status") titleRef.current?.focus();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return onUnauthorized();
      setActionError(error instanceof ApiError ? error.message : "Có lỗi xảy ra. Vui lòng thử lại.");
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
      className="m-0 ml-auto h-dvh max-h-dvh w-full max-w-lg overflow-y-auto overscroll-contain bg-enamel p-0 text-ink backdrop:bg-ink/40 sm:border-l sm:border-ink/15"
    >
      <div className="flex items-center justify-between gap-3 border-b border-ink/15 px-5 py-4">
        <h2 ref={titleRef} tabIndex={-1} id="order-detail-title" className="text-xl font-semibold">
          Đơn {code}
        </h2>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className="rounded-lg px-3 py-1.5 font-medium text-ink/75 hover:bg-ink/8"
        >
          Đóng
        </button>
      </div>

      <div className="space-y-6 px-5 py-5">
        {load.status === "loading" ? <p className="text-ink/70">Đang tải…</p> : null}
        {load.status === "error" ? (
          <div role="alert" className="rounded-lg bg-chili/10 px-4 py-3 text-chili">
            <p>{load.message}</p>
            <button type="button" onClick={() => setAttempt((n) => n + 1)} className="mt-2 font-semibold underline">
              Thử lại
            </button>
          </div>
        ) : null}

        {order ? (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={order.status} />
              <span className="text-sm text-ink/70 tabular-nums">
                Đặt {formatSlot(order.createdAt)} · Nhận {formatSlot(order.deliverySlot)}
              </span>
            </div>

            <dl className="grid grid-cols-[7rem_1fr] gap-x-3 gap-y-2 text-[15px]">
              <dt className="text-ink/70">Khách</dt>
              <dd>{order.customerName}</dd>
              <dt className="text-ink/70">SĐT</dt>
              <dd>
                <a href={`tel:${order.phone}`} className="text-rim-strong underline underline-offset-4">
                  {order.phone}
                </a>
              </dd>
              <dt className="text-ink/70">Địa chỉ</dt>
              <dd className="break-words">{order.address}</dd>
              <dt className="text-ink/70">Ghi chú khách</dt>
              <dd className="whitespace-pre-line break-words">{order.note || "—"}</dd>
            </dl>

            <div>
              <h3 className="font-semibold">Món</h3>
              <ul className="mt-2 divide-y divide-ink/10 border-y border-ink/10 text-[15px] tabular-nums">
                {order.items.map((item) => (
                  <li key={item.productId} className="flex justify-between gap-3 py-2">
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span>{formatVnd(item.unitPrice * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 flex justify-between font-semibold tabular-nums">
                <span>Tổng</span>
                <span>{formatVnd(order.total)}</span>
              </p>
            </div>

            {next || canCancel(order.status) ? (
              <div className="flex flex-wrap gap-3">
                {next && nextLabel ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => save({ status: next }, "status")}
                    className="min-h-11 rounded-lg bg-rim px-5 font-semibold text-on-rim hover:bg-rim/90 disabled:opacity-60"
                  >
                    {saving === "status" ? "Đang lưu…" : nextLabel}
                  </button>
                ) : null}
                {canCancel(order.status) && !confirmCancel ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setConfirmCancel(true)}
                    className="min-h-11 rounded-lg border border-chili px-5 font-semibold text-chili hover:bg-chili/10 disabled:opacity-60"
                  >
                    Huỷ đơn
                  </button>
                ) : null}
                {confirmCancel ? (
                  <div className="flex w-full flex-wrap items-center gap-3 rounded-lg bg-chili/8 p-3">
                    <span className="font-medium">Huỷ đơn {order.code}?</span>
                    <button
                      ref={confirmCancelRef}
                      type="button"
                      disabled={busy}
                      onClick={() => save({ status: "CANCELLED" }, "status")}
                      className="min-h-10 rounded-lg bg-chili px-4 font-semibold text-enamel disabled:opacity-60"
                    >
                      Xác nhận huỷ
                    </button>
                    <button type="button" onClick={() => setConfirmCancel(false)} className="min-h-10 px-3 font-medium">
                      Không
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            <form
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
                className="mt-1.5 block w-full rounded-lg border border-ink/25 bg-surface px-3 py-2 focus:border-rim-strong focus:outline-none"
              />
              <button
                type="submit"
                disabled={busy || note === (order.internalNote ?? "")}
                className="mt-2 min-h-10 rounded-lg border border-rim-strong px-4 font-medium text-rim-strong hover:bg-rim/10 disabled:opacity-50"
              >
                {saving === "note" ? "Đang lưu…" : "Lưu ghi chú"}
              </button>
            </form>

            <div aria-live="polite" className="min-h-6">
              {notice ? <p className="font-medium text-herb">{notice}</p> : null}
              {actionError ? <p role="alert" className="font-medium text-chili">{actionError}</p> : null}
            </div>
          </>
        ) : null}
      </div>
    </dialog>
  );
}
