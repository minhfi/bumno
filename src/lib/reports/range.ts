import { shop } from "@/config/shop";
import { DAY_MS, shopDateString, shopDayRange } from "@/lib/orders/slots";
import type { ReportBucket, ReportRange } from "./types";

const HOUR_MS = 3_600_000;
const offsetMs = shop.utcOffsetMinutes * 60_000;

export const RANGE_DAYS: Record<ReportRange, number> = { today: 1, "7d": 7, "30d": 30, "365d": 365 };
export const RANGE_BUCKET: Record<ReportRange, ReportBucket> = { today: "hour", "7d": "day", "30d": "day", "365d": "month" };

export type ReportWindow = { from: Date; to: Date };

type DeliveryHours = Pick<typeof shop, "deliveryStartMinute" | "deliveryEndMinute">;

/** Rolling window ending at shop-time midnight after `at`'s day: [today − (N−1) days, tomorrow). */
export function reportWindow(range: ReportRange, at: Date): ReportWindow {
  const today = shopDayRange(shopDateString(at));
  if (!today) throw new Error("Invalid date");
  const to = today.end.getTime();
  return { from: new Date(to - RANGE_DAYS[range] * DAY_MS), to: new Date(to) };
}

/** The window of the same length immediately before `window`. */
export function previousWindow({ from, to }: ReportWindow): ReportWindow {
  return { from: new Date(from.getTime() - (to.getTime() - from.getTime())), to: from };
}

/** Shop-time midnight of the 1st of the month after the one containing `at`. */
function nextMonthStart(at: number): number {
  const local = new Date(at + offsetMs);
  return Date.UTC(local.getUTCFullYear(), local.getUTCMonth() + 1, 1) - offsetMs;
}

/**
 * Bucket start times covering `window`: delivery hours for `hour`, every day for `day`, and every calendar month for
 * `month` (the first bucket starts at `from`, so it may be a partial month).
 */
export function bucketStarts(bucket: ReportBucket, { from, to }: ReportWindow, hours: DeliveryHours = shop): Date[] {
  const starts: Date[] = [];
  const start = from.getTime();
  const end = to.getTime();
  if (bucket === "hour") {
    for (let hour = Math.floor(hours.deliveryStartMinute / 60); hour * 60 < hours.deliveryEndMinute; hour++) {
      starts.push(new Date(start + hour * HOUR_MS));
    }
  } else if (bucket === "day") {
    for (let t = start; t < end; t += DAY_MS) starts.push(new Date(t));
  } else {
    for (let t = start; t < end; t = nextMonthStart(t)) starts.push(new Date(t));
  }
  return starts;
}

/**
 * Shop-local time of `at` truncated to `bucket`, as epoch seconds of that local wall time read as UTC.
 * Matches `EXTRACT(EPOCH FROM date_trunc(bucket, <local timestamp>))` in SQL, so it keys series rows to buckets.
 */
export function bucketKey(bucket: ReportBucket, at: Date): number {
  const local = new Date(at.getTime() + offsetMs);
  const truncated =
    bucket === "month"
      ? Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1)
      : bucket === "day"
        ? Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate())
        : Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), local.getUTCHours());
  return truncated / 1000;
}
