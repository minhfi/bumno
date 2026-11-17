"use client";

import { useState, type FormEvent } from "react";
import { STATUS_LABELS } from "@/lib/orders/status";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/orders/types";
import type { OrderFiltersValue } from "./use-orders";

type Props = {
  value: OrderFiltersValue;
  /** Date shown when no date filter is set (today in the shop time zone). */
  today: string;
  /** The day before `today`, `YYYY-MM-DD`. */
  yesterday: string;
  onChange: (next: OrderFiltersValue) => void;
};

const fieldClass =
  "min-h-11 rounded-lg border border-ink/20 bg-surface px-3 focus:border-rim-strong focus:outline-none";
const chipClass =
  "min-h-10 shrink-0 rounded-full px-4 text-[15px] font-medium text-ink/75 hover:bg-ink/6 aria-pressed:bg-ink aria-pressed:text-enamel";

const statusTabs: { status: OrderStatus | undefined; label: string }[] = [
  { status: undefined, label: "Tất cả" },
  ...ORDER_STATUSES.map((status) => ({ status, label: STATUS_LABELS[status] })),
];

export function OrderFilters({ value, today, yesterday, onChange }: Props) {
  const [q, setQ] = useState(value.q ?? "");
  const [syncedQ, setSyncedQ] = useState(value.q);
  // Follow search text changed from outside the form (e.g. back/forward navigation).
  if (value.q !== syncedQ) {
    setSyncedQ(value.q);
    setQ(value.q ?? "");
  }

  const date = value.date ?? today;
  const setDate = (next: string) => onChange({ ...value, date: next && next !== today ? next : undefined, page: 1 });

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onChange({ ...value, q: q.trim() || undefined, page: 1 });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div role="group" aria-label="Ngày đặt" className="flex items-center gap-1">
          <button type="button" aria-pressed={date === yesterday} onClick={() => setDate(yesterday)} className={chipClass}>
            Hôm qua
          </button>
          <button type="button" aria-pressed={date === today} onClick={() => setDate(today)} className={chipClass}>
            Hôm nay
          </button>
        </div>
        <label className="flex items-center gap-2 text-[15px] text-ink/75">
          <span>Ngày đặt</span>
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            className={`${fieldClass} text-ink tabular-nums`}
          />
        </label>
        <form role="search" onSubmit={submitSearch} className="flex min-w-[260px] flex-1 gap-2 md:max-w-[380px] md:ml-auto">
          <label htmlFor="filter-q" className="sr-only">
            Tìm SĐT hoặc mã đơn
          </label>
          <input
            id="filter-q"
            type="search"
            inputMode="search"
            placeholder="Tìm SĐT hoặc mã đơn"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className={`${fieldClass} min-w-0 flex-1`}
          />
          <button type="submit" className="min-h-11 rounded-lg bg-ink px-4 font-semibold text-enamel hover:bg-ink/85">
            Tìm
          </button>
        </form>
      </div>

      <div
        role="group"
        aria-label="Trạng thái"
        className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0"
      >
        {statusTabs.map(({ status, label }) => (
          <button
            key={label}
            type="button"
            aria-pressed={value.status === status}
            onClick={() => onChange({ ...value, status, page: 1 })}
            className={chipClass}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
