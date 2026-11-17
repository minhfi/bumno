"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { formatVnd } from "@/config/menu";
import { shop } from "@/config/shop";
import { shopDateString } from "@/lib/orders/slots";
import type { ReportBucket, ReportSeriesPoint } from "@/lib/reports/types";

/** `DD/MM` (or `DD/MM/YYYY`) of a shop-time instant. */
function dayMonth(at: number, withYear = false): string {
  const [year, month, day] = shopDateString(new Date(at)).split("-");
  return withYear ? `${day}/${month}/${year}` : `${day}/${month}`;
}

function hourOf(at: number): number {
  return Number(new Date(at + shop.utcOffsetMinutes * 60_000).toISOString().slice(11, 13));
}

/** Full period of a bucket, for the value label and the screen-reader table. */
function periodLabel(bucket: ReportBucket, start: string, index: number, count: number): string {
  const at = Date.parse(start);
  if (bucket === "hour") return `${hourOf(at)}:00–${hourOf(at) + 1}:00, ${dayMonth(at)}`;
  if (bucket === "day") return dayMonth(at, true);
  const [year, month, day] = shopDateString(new Date(at)).split("-");
  if (index === 0 && day !== "01") return `Từ ${dayMonth(at, true)}`;
  return `Tháng ${Number(month)}/${year}${index === count - 1 ? " (đến hôm nay)" : ""}`;
}

/** Short axis label; `null` hides it to keep the axis readable. */
function axisLabel(bucket: ReportBucket, start: string, index: number, count: number): string | null {
  const at = Date.parse(start);
  if (bucket === "hour") return index % 2 === 0 ? `${hourOf(at)}h` : null;
  if (bucket === "month") {
    const [year, month, day] = shopDateString(new Date(at)).split("-");
    if (index === 0 && day !== "01") return `từ ${dayMonth(at)}`;
    return `${month}/${year.slice(2)}`;
  }
  if (count <= 7) return dayMonth(at);
  const isFirstOfMonth = shopDateString(new Date(at)).endsWith("-01");
  return index === 0 || index === count - 1 || isFirstOfMonth ? dayMonth(at) : null;
}

const CHART_HEIGHT = 160;
const BAR_SLOT = 20;
const BAR_GAP = 4;

type Props = { bucket: ReportBucket; series: ReportSeriesPoint[] };

const titles: Record<ReportBucket, string> = {
  hour: "Doanh thu theo giờ giao",
  day: "Doanh thu theo ngày",
  month: "Doanh thu theo tháng",
};

/**
 * Hand-drawn bar chart. Hovering or focusing a bar shows its exact value; bars are one tab stop, moved with the arrow
 * keys, Home and End. A visually hidden table carries the same figures for screen readers.
 */
export function RevenueChart({ bucket, series }: Props) {
  const [active, setActive] = useState<number | null>(null);
  const [focusIndex, setFocusIndex] = useState(series.length - 1);
  const barRefs = useRef<(SVGRectElement | null)[]>([]);

  const max = Math.max(...series.map((point) => point.revenue), 0);
  const width = series.length * BAR_SLOT;
  const count = series.length;
  const tabIndex = Math.min(focusIndex, count - 1);

  function moveFocus(event: KeyboardEvent<SVGSVGElement>) {
    const keys: Record<string, number> = { ArrowLeft: tabIndex - 1, ArrowRight: tabIndex + 1, Home: 0, End: count - 1 };
    if (!(event.key in keys)) return;
    event.preventDefault();
    const next = Math.max(0, Math.min(count - 1, keys[event.key]));
    setFocusIndex(next);
    setActive(next);
    barRefs.current[next]?.focus();
  }

  const shown = active === null ? null : series[active];

  return (
    <figure className="border-t border-ink/10 pt-4">
      <figcaption className="font-semibold">{titles[bucket]}</figcaption>
      <p className="mt-1 text-sm text-ink/65 tabular-nums">Cao nhất {formatVnd(max)}</p>

      <div className="-mx-4 mt-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        <div className="relative pt-14" style={{ minWidth: `${count * (count > 14 ? 16 : 22)}px` }}>
          {shown && active !== null ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-0 z-10 whitespace-nowrap rounded-md bg-ink px-2.5 py-1.5 text-sm text-enamel shadow tabular-nums"
              style={{
                left: `${((active + 0.5) / count) * 100}%`,
                transform: active < count * 0.2 ? "translateX(-12px)" : active > count * 0.8 ? "translateX(calc(-100% + 12px))" : "translateX(-50%)",
              }}
            >
              <span className="block text-xs opacity-80">{periodLabel(bucket, shown.start, active, count)}</span>
              <span className="font-semibold">{formatVnd(shown.revenue)}</span> · {shown.completedOrders} đơn
            </div>
          ) : null}

          <svg
            role="group"
            aria-label={`${titles[bucket]}, dùng phím mũi tên để xem từng cột`}
            viewBox={`0 0 ${width} ${CHART_HEIGHT}`}
            preserveAspectRatio="none"
            className="block h-40 w-full overflow-visible"
            onKeyDown={moveFocus}
            onMouseLeave={() => {
              // Keep the label of a bar that still has keyboard focus.
              const focused = barRefs.current.findIndex((bar) => bar !== null && bar === document.activeElement);
              setActive(focused >= 0 ? focused : null);
            }}
          >
            <line x1={0} x2={width} y1={0.5} y2={0.5} className="stroke-ink/15" vectorEffect="non-scaling-stroke" />
            <line x1={0} x2={width} y1={CHART_HEIGHT / 2} y2={CHART_HEIGHT / 2} className="stroke-ink/10" vectorEffect="non-scaling-stroke" />
            <line x1={0} x2={width} y1={CHART_HEIGHT - 0.5} y2={CHART_HEIGHT - 0.5} className="stroke-ink/30" vectorEffect="non-scaling-stroke" />
            {series.map((point, index) => {
              const height = max > 0 ? Math.max((point.revenue / max) * CHART_HEIGHT, point.revenue > 0 ? 2 : 0) : 0;
              const isActive = index === active;
              return (
                <g key={point.start}>
                  <rect
                    x={index * BAR_SLOT + BAR_GAP / 2}
                    y={CHART_HEIGHT - height}
                    width={BAR_SLOT - BAR_GAP}
                    height={height}
                    className={isActive ? "fill-rim-strong" : "fill-rim"}
                  />
                  {/* Full-height hit area: easier to hover or tap than a short bar, and the focus target. */}
                  <rect
                    ref={(element) => {
                      barRefs.current[index] = element;
                    }}
                    x={index * BAR_SLOT}
                    y={0}
                    width={BAR_SLOT}
                    height={CHART_HEIGHT}
                    role="img"
                    aria-label={`${periodLabel(bucket, point.start, index, count)}: ${formatVnd(point.revenue)}, ${point.completedOrders} đơn`}
                    tabIndex={index === tabIndex ? 0 : -1}
                    vectorEffect="non-scaling-stroke"
                    className="cursor-pointer fill-transparent outline-none focus-visible:fill-ink/8 focus-visible:stroke-ink focus-visible:stroke-2"
                    onMouseEnter={() => setActive(index)}
                    onClick={() => setActive(index)}
                    onFocus={() => {
                      setFocusIndex(index);
                      setActive(index);
                    }}
                    onBlur={() => setActive(null)}
                  />
                </g>
              );
            })}
          </svg>

          <div aria-hidden="true" className="relative mt-1.5 h-5 text-xs text-ink/65 tabular-nums">
            {series.map((point, index) => {
              const label = axisLabel(bucket, point.start, index, count);
              if (!label) return null;
              const edge = index === 0 ? "translateX(0)" : index === count - 1 ? "translateX(-100%)" : "translateX(-50%)";
              const left = index === 0 ? 0 : index === count - 1 ? 100 : ((index + 0.5) / count) * 100;
              return (
                <span key={point.start} className="absolute whitespace-nowrap" style={{ left: `${left}%`, transform: edge }}>
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <table className="sr-only">
        <caption>{titles[bucket]}</caption>
        <thead>
          <tr>
            <th scope="col">Thời gian</th>
            <th scope="col">Doanh thu</th>
            <th scope="col">Đơn hoàn thành</th>
          </tr>
        </thead>
        <tbody>
          {series.map((point, index) => (
            <tr key={point.start}>
              <th scope="row">{periodLabel(bucket, point.start, index, count)}</th>
              <td>{formatVnd(point.revenue)}</td>
              <td>{point.completedOrders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
