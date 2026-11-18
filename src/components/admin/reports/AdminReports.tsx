"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { DAY_MS, shopDateString } from "@/lib/orders/slots";
import { REPORT_RANGES, type ReportRange, type ReportResponse } from "@/lib/reports/types";
import { AdminHeader } from "../AdminHeader";
import { MetricTiles } from "./MetricTiles";
import { RangeTabs } from "./RangeTabs";
import { RevenueChart } from "./RevenueChart";
import { TopItems } from "./TopItems";
import { useReport } from "./use-report";

function readRange(value: string | null): ReportRange {
  return REPORT_RANGES.find((range) => range === value) ?? "today";
}

/** `18/10 – 17/11/2026`, or a single day for today. */
function rangeLabel({ from, to }: Pick<ReportResponse, "from" | "to">): string {
  const format = (date: string) => date.split("-").reverse().join("/");
  const first = shopDateString(new Date(from));
  const last = shopDateString(new Date(Date.parse(to) - DAY_MS));
  if (first === last) return format(last);
  const short = first.slice(0, 4) === last.slice(0, 4) ? format(first).slice(0, 5) : format(first);
  return `${short} – ${format(last)}`;
}

function Skeleton() {
  const block = "animate-pulse rounded bg-ink/8 motion-reduce:animate-none";
  return (
    <div aria-label="Đang tải báo cáo…" role="status" className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-[minmax(0,1.8fr)_repeat(4,minmax(0,1fr))]">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className={`border-t border-ink/10 pt-4 ${i === 0 ? "col-span-2 sm:col-span-3 lg:col-span-1" : ""}`}>
            <span className={`block h-4 w-20 ${block}`} />
            <span className={`mt-2 block h-9 w-32 ${block}`} />
          </div>
        ))}
      </div>
      <span className={`block h-48 w-full ${block}`} />
      <span className={`block h-32 w-full ${block}`} />
    </div>
  );
}

export function AdminReports() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const range = readRange(searchParams.get("range"));

  const goToLogin = useCallback(() => router.replace("/admin"), [router]);
  const { data, error, loading, reload } = useReport(range, goToLogin);

  function setRange(next: ReportRange) {
    router.replace(next === "today" ? pathname : `${pathname}?range=${next}`, { scroll: false });
  }

  return (
    <div className="mx-auto max-w-[1120px] px-4 pb-10 pt-6 sm:px-6">
      <AdminHeader title="Báo cáo" />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 sm:mt-5 sm:gap-y-2">
        <RangeTabs value={range} onChange={setRange} />
        <p aria-live="polite" className="text-sm text-ink/70 tabular-nums">
          {data ? `${rangeLabel(data)} (theo ngày giao)` : null}
        </p>
      </div>

      {error ? (
        <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 border-l-4 border-chili bg-chili/8 px-4 py-3 text-chili">
          <span>{data ? "Không làm mới được báo cáo. Đang hiện dữ liệu cũ." : error.message}</span>
          <button type="button" onClick={() => void reload()} className="min-h-11 font-semibold underline sm:min-h-9 underline-offset-4">
            Thử lại
          </button>
        </div>
      ) : null}

      <div aria-busy={loading} className="mt-3 sm:mt-5">
        {!data && loading ? <Skeleton /> : null}

        {data ? (
          <div className={`space-y-4 sm:space-y-6 ${loading ? "opacity-60" : ""}`}>
            <MetricTiles data={data} />
            {data.current.completedOrders === 0 ? (
              <div className="border-y border-ink/10 bg-surface px-5 py-12 text-center">
                <h2 className="font-display text-2xl font-bold">Chưa có doanh thu</h2>
                <p className="mt-1 text-ink/70">Chưa có đơn hoàn thành trong khoảng này.</p>
              </div>
            ) : (
              <>
                <RevenueChart key={data.range} bucket={data.bucket} series={data.series} />
                <TopItems items={data.items} />
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
