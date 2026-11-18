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

/** One segment of the date control; the pressed one is filled. */
const segmentClass =
  "min-h-9 shrink-0 rounded-md px-3 text-[15px] font-medium text-ink/75 hover:bg-ink/6 aria-pressed:bg-ink aria-pressed:text-enamel sm:min-h-[30px] sm:text-sm";
/** Underline tab; color and rim only (no weight change), so the row does not shift. */
const tabClass =
  "-mb-px min-h-10 shrink-0 border-b-2 border-transparent px-3 text-[15px] font-medium text-ink/65 hover:text-ink aria-pressed:border-rim aria-pressed:text-ink sm:min-h-9 sm:text-sm";

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
    <div className="space-y-3">
      <div
        role="group"
        aria-label="Trạng thái"
        className="-mx-4 flex overflow-x-auto border-b border-ink/10 px-4 [scrollbar-width:none] sm:mx-0 sm:px-0"
      >
        {statusTabs.map(({ status, label }) => (
          <button
            key={label}
            type="button"
            aria-pressed={value.status === status}
            onClick={() => onChange({ ...value, status, page: 1 })}
            className={tabClass}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Ngày đặt" className="flex items-center rounded-lg border border-ink/20 bg-surface p-0.5">
          <button type="button" aria-pressed={date === yesterday} onClick={() => setDate(yesterday)} className={segmentClass}>
            Hôm qua
          </button>
          <button type="button" aria-pressed={date === today} onClick={() => setDate(today)} className={segmentClass}>
            Hôm nay
          </button>
          <label className="ml-0.5 flex border-l border-ink/15 pl-0.5">
            <span className="sr-only">Ngày đặt</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="min-h-9 w-[8.75rem] rounded-md bg-transparent px-2 text-[15px] text-ink tabular-nums focus:outline-none focus-visible:outline-3 focus-visible:outline-rim-strong sm:min-h-[30px] sm:w-auto sm:text-sm"
            />
          </label>
        </div>

        <form role="search" onSubmit={submitSearch} className="flex w-full gap-2 sm:w-auto sm:min-w-[340px]">
          <label htmlFor="filter-q" className="sr-only">
            Tìm SĐT hoặc mã đơn
          </label>
          <span className="relative min-w-0 flex-1">
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 fill-none stroke-ink/50 stroke-2"
            >
              <circle cx="8.5" cy="8.5" r="5.5" />
              <path d="m13 13 4 4" strokeLinecap="round" />
            </svg>
            <input
              id="filter-q"
              type="search"
              inputMode="search"
              placeholder="Tìm SĐT hoặc mã đơn"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="min-h-10 w-full rounded-lg border border-ink/20 bg-surface pl-9 pr-3 focus:border-rim-strong focus:outline-none sm:min-h-9 sm:text-sm"
            />
          </span>
          <button type="submit" className="min-h-10 rounded-lg bg-ink px-4 font-semibold text-enamel hover:bg-ink/85 sm:min-h-9 sm:text-sm">
            Tìm
          </button>
        </form>
      </div>
    </div>
  );
}
