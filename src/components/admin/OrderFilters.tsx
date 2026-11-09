"use client";

import { useState, type FormEvent } from "react";
import { isOrderStatus, STATUS_LABELS } from "@/lib/orders/status";
import { ORDER_STATUSES } from "@/lib/orders/types";
import type { OrderFiltersValue } from "./use-orders";

type Props = {
  value: OrderFiltersValue;
  /** Date shown when no date filter is set (today in the shop time zone). */
  today: string;
  onChange: (next: OrderFiltersValue) => void;
};

const controlClass = "rounded-lg border border-ink/25 bg-surface px-3 py-2 focus:border-rim focus:outline-none";

export function OrderFilters({ value, today, onChange }: Props) {
  const [q, setQ] = useState(value.q ?? "");
  const [syncedQ, setSyncedQ] = useState(value.q);
  // Follow search text changed from outside the form (e.g. back/forward navigation).
  if (value.q !== syncedQ) {
    setSyncedQ(value.q);
    setQ(value.q ?? "");
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onChange({ ...value, q: q.trim() || undefined, page: 1 });
  }

  return (
    <form role="search" onSubmit={submitSearch} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col">
        <label htmlFor="filter-date" className="text-sm font-medium text-ink/75">
          Ngày
        </label>
        <input
          id="filter-date"
          type="date"
          value={value.date ?? today}
          onChange={(e) => onChange({ ...value, date: e.target.value && e.target.value !== today ? e.target.value : undefined, page: 1 })}
          className={controlClass}
        />
      </div>
      <div className="flex flex-col">
        <label htmlFor="filter-status" className="text-sm font-medium text-ink/75">
          Trạng thái
        </label>
        <select
          id="filter-status"
          value={value.status ?? ""}
          onChange={(e) => onChange({ ...value, status: isOrderStatus(e.target.value) ? e.target.value : undefined, page: 1 })}
          className={controlClass}
        >
          <option value="">Tất cả</option>
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex min-w-[220px] flex-1 flex-col">
        <label htmlFor="filter-q" className="text-sm font-medium text-ink/75">
          Tìm SĐT hoặc mã đơn
        </label>
        <div className="flex gap-2">
          <input
            id="filter-q"
            type="search"
            inputMode="search"
            placeholder="0901… hoặc BN-1042"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className={`${controlClass} min-w-0 flex-1`}
          />
          <button type="submit" className="rounded-lg border border-rim px-4 font-medium text-rim hover:bg-rim hover:text-enamel">
            Tìm
          </button>
        </div>
      </div>
    </form>
  );
}
