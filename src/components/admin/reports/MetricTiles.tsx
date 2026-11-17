import type { ReactNode } from "react";
import { formatVnd } from "@/config/menu";
import type { ReportResponse, ReportSummary } from "@/lib/reports/types";

const percentFormat = new Intl.NumberFormat("vi-VN", { style: "percent", maximumFractionDigits: 1 });
const wholePercentFormat = new Intl.NumberFormat("vi-VN", { style: "percent", maximumFractionDigits: 0 });
const pointsFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });

type Change = { direction: "up" | "down" | "flat"; text: string } | null;

/** % change against the previous period; null ("—") when the previous value is 0. */
function relativeChange(current: number, previous: number): Change {
  if (previous === 0) return null;
  const ratio = (current - previous) / previous;
  const text = wholePercentFormat.format(Math.abs(ratio));
  if (text === wholePercentFormat.format(0)) return { direction: "flat", text };
  return { direction: ratio > 0 ? "up" : "down", text };
}

/** Change in percentage points; null when the previous period had no completed or cancelled orders. */
function pointsChange(current: ReportSummary, previous: ReportSummary): Change {
  if (previous.completedOrders + previous.cancelledOrders === 0) return null;
  const points = (current.cancelRate - previous.cancelRate) * 100;
  const text = `${pointsFormat.format(Math.abs(points))} điểm`;
  if (pointsFormat.format(Math.abs(points)) === "0") return { direction: "flat", text };
  return { direction: points > 0 ? "up" : "down", text };
}

/** ▲/▼ plus words, so the change does not rely on color. `upIsGood` is false for the cancel rate. */
function ChangeLine({ change, upIsGood = true }: { change: Change; upIsGood?: boolean }) {
  if (!change) {
    return (
      <p className="mt-1 text-sm text-ink/65">
        <span aria-hidden="true">—</span>
        <span className="sr-only">Kỳ trước chưa có số liệu</span>
      </p>
    );
  }
  const good = change.direction === "flat" ? null : (change.direction === "up") === upIsGood;
  const color = good === null ? "text-ink/65" : good ? "text-herb" : "text-chili";
  const arrow = change.direction === "up" ? "▲" : change.direction === "down" ? "▼" : "=";
  const word = change.direction === "up" ? "Tăng" : change.direction === "down" ? "Giảm" : "Bằng";
  return (
    <p className={`mt-1 text-sm font-medium tabular-nums ${color}`}>
      <span aria-hidden="true">{arrow} </span>
      <span className="sr-only">{word} </span>
      {change.text} <span className="font-normal text-ink/65">so với kỳ trước</span>
    </p>
  );
}

type TileProps = { label: string; value: string; children: ReactNode; loud?: boolean; className?: string };

function Tile({ label, value, children, loud = false, className = "" }: TileProps) {
  return (
    <div className={`min-w-0 border-t border-ink/10 py-4 pr-4 ${className}`}>
      <dt className="text-sm font-medium text-ink/70">{label}</dt>
      <dd className="mt-1">
        <span className={`block font-display font-extrabold leading-none tabular-nums break-words ${loud ? "text-[48px]" : "text-[28px] sm:text-[34px]"}`}>{value}</span>
        {children}
      </dd>
    </div>
  );
}

type Props = { data: Pick<ReportResponse, "current" | "previous" | "pending"> };

export function MetricTiles({ data: { current, previous, pending } }: Props) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 sm:grid-cols-3 lg:grid-cols-[minmax(0,1.8fr)_repeat(4,minmax(0,1fr))]">
      <Tile label="Doanh thu" value={formatVnd(current.revenue)} loud className="col-span-2 sm:col-span-3 lg:col-span-1">
        <ChangeLine change={relativeChange(current.revenue, previous.revenue)} />
      </Tile>
      <Tile label="Đơn hoàn thành" value={String(current.completedOrders)}>
        <ChangeLine change={relativeChange(current.completedOrders, previous.completedOrders)} />
      </Tile>
      <Tile label="TB / đơn" value={formatVnd(current.averageOrderValue)}>
        <ChangeLine change={relativeChange(current.averageOrderValue, previous.averageOrderValue)} />
      </Tile>
      <Tile label="Tỉ lệ huỷ" value={percentFormat.format(current.cancelRate)}>
        <p className="mt-1 text-sm text-ink/65">{current.cancelledOrders} đơn huỷ</p>
        <ChangeLine change={pointsChange(current, previous)} upIsGood={false} />
      </Tile>
      <Tile label="Đang chờ" value={`${pending.orders} đơn`}>
        <p className="mt-1 text-sm text-ink/65 tabular-nums">{formatVnd(pending.total)} chưa hoàn thành</p>
      </Tile>
    </dl>
  );
}
