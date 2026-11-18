"use client";

import { useState, type FormEvent } from "react";
import { STATUS_LABELS } from "@/lib/orders/status";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/orders/types";
import type { OrderFiltersValue } from "./use-orders";

type Props = {
  value: OrderFiltersValue;
  /** Date shown when no date filter is set (today in the shop time zone). */
  today: string;
  onChange: (next: OrderFiltersValue) => void;
};

/** Underline tab; color and rim only (no weight change), so the row does not shift. */
const tabClass =
  "-mb-px min-h-10 shrink-0 border-b-2 border-transparent px-3 text-[15px] font-medium text-ink/65 hover:text-ink aria-pressed:border-rim aria-pressed:text-ink sm:min-h-9 sm:text-sm";

const statusTabs: { status: OrderStatus | undefined; label: string }[] = [
  { status: undefined, label: "Tất cả" },
  ...ORDER_STATUSES.map((status) => ({ status, label: STATUS_LABELS[status] })),
];

/** "2026-11-18" → "18/11/2026". */
function formatDateLabel(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return year && month && day ? `${day}/${month}/${year}` : isoDate;
}

export function OrderFilters({ value, today, onChange }: Props) {
  const [q, setQ] = useState(value.q ?? "");
  const [syncedQ, setSyncedQ] = useState(value.q);
  // Follow search text changed from outside the form (e.g. back/forward navigation).
  if (value.q !== syncedQ) {
    setSyncedQ(value.q);
    setQ(value.q ?? "");
  }

  const date = value.date ?? today;
  const setDate = (next: string) => onChange({ ...value, date: next && next !== today ? next : undefined });

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onChange({ ...value, q: q.trim() || undefined });
  }

  // Wide screens: status tabs and the toolbar share one row above the list; narrower screens stack them.
  return (
    <div className="space-y-3 min-[1080px]:flex min-[1080px]:items-end min-[1080px]:justify-between min-[1080px]:gap-6 min-[1080px]:space-y-0 min-[1080px]:border-b min-[1080px]:border-ink/10">
      <div
        role="group"
        aria-label="Trạng thái"
        className="-mx-4 flex overflow-x-auto border-b border-ink/10 px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 min-[1080px]:border-b-0"
      >
        {statusTabs.map(({ status, label }) => (
          <button
            key={label}
            type="button"
            aria-pressed={value.status === status}
            onClick={() => onChange({ ...value, status })}
            className={tabClass}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 sm:gap-3 min-[1080px]:shrink-0 min-[1080px]:pb-1">
        {/* Touch browsers (iOS) render the date in a long locale form ("ngày 18 thg 11, 2026"), so there the
            input goes transparent over a dd/mm/yyyy label; tapping it still opens the native picker. */}
        <label className="relative shrink-0 has-focus:[&>span]:border-rim-strong">
          <span className="sr-only">Ngày đặt</span>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 hidden items-center rounded-lg border border-ink/20 bg-surface px-2.5 text-ink tabular-nums pointer-coarse:flex sm:px-3 sm:text-sm"
          >
            {formatDateLabel(date)}
          </span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-10 w-[9.25rem] rounded-lg border border-ink/20 bg-surface px-2.5 text-ink tabular-nums focus:border-rim-strong focus:outline-none pointer-coarse:relative pointer-coarse:opacity-0 sm:h-9 sm:w-auto sm:px-3 sm:text-sm"
          />
        </label>

        <form role="search" onSubmit={submitSearch} className="flex min-w-0 flex-1 gap-2 sm:max-w-[380px] min-[1080px]:w-[300px] min-[1080px]:flex-none">
          <label htmlFor="filter-q" className="sr-only">
            Tìm SĐT hoặc mã đơn
          </label>
          <span className="relative min-w-0 flex-1">
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 fill-none stroke-ink/50 stroke-2"
            >
              <circle cx="8.5" cy="8.5" r="5.5" />
              <path d="m13 13 4 4" strokeLinecap="round" />
            </svg>
            <input
              id="filter-q"
              type="search"
              inputMode="search"
              placeholder="SĐT hoặc mã đơn"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="min-h-10 w-full rounded-lg border border-ink/20 bg-surface pl-8 pr-3 focus:border-rim-strong focus:outline-none sm:min-h-9 sm:pl-9 sm:text-sm"
            />
          </span>
          {/* Phones submit with the keyboard's search key (Enter), so the button only shows from `sm`. */}
          <button type="submit" className="hidden min-h-9 rounded-lg bg-ink px-4 text-sm font-semibold text-enamel hover:bg-ink/85 sm:block">
            Tìm
          </button>
        </form>
      </div>
    </div>
  );
}
