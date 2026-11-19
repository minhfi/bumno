import { describe, expect, it } from "vitest";
import { bucketKey, bucketStarts, previousWindow, RANGE_BUCKET, reportWindow } from "./range";

/** A time in Asia/Ho_Chi_Minh. */
const vn = (local: string) => new Date(`${local}:00+07:00`);
const iso = (local: string) => vn(local).toISOString();

describe("reportWindow", () => {
  it("covers today in shop time, from midnight to the next midnight", () => {
    const window = reportWindow("today", vn("2026-11-17T07:00"));
    expect(window.from.toISOString()).toBe(iso("2026-11-17T00:00"));
    expect(window.to.toISOString()).toBe(iso("2026-11-18T00:00"));
  });

  it("uses the shop day, not the UTC day, just after VN midnight", () => {
    // 00:30 VN on the 17th is still the 16th in UTC.
    const window = reportWindow("today", vn("2026-11-17T00:30"));
    expect(window.from.toISOString()).toBe("2026-11-16T17:00:00.000Z");
    // 23:59 VN on the 17th.
    expect(reportWindow("today", vn("2026-11-17T23:59")).from.toISOString()).toBe("2026-11-16T17:00:00.000Z");
  });

  it("rolls back N−1 days including today", () => {
    const at = vn("2026-11-17T07:00");
    expect(reportWindow("7d", at).from.toISOString()).toBe(iso("2026-11-11T00:00"));
    expect(reportWindow("30d", at).from.toISOString()).toBe(iso("2026-10-19T00:00"));
    expect(reportWindow("365d", at).from.toISOString()).toBe(iso("2025-11-18T00:00"));
    expect(reportWindow("365d", at).to.toISOString()).toBe(iso("2026-11-18T00:00"));
  });
});

describe("previousWindow", () => {
  it("is the same length, right before", () => {
    const prev = previousWindow(reportWindow("7d", vn("2026-11-17T07:00")));
    expect(prev.from.toISOString()).toBe(iso("2026-11-04T00:00"));
    expect(prev.to.toISOString()).toBe(iso("2026-11-11T00:00"));
    expect(previousWindow(reportWindow("today", vn("2026-11-17T07:00"))).from.toISOString()).toBe(iso("2026-11-16T00:00"));
  });
});

describe("bucketStarts", () => {
  const at = vn("2026-11-17T07:00");

  it("today: one bucket per delivery hour, 6:00 to 14:00", () => {
    const starts = bucketStarts(RANGE_BUCKET.today, reportWindow("today", at));
    expect(starts).toHaveLength(9);
    expect(starts[0].toISOString()).toBe(iso("2026-11-17T06:00"));
    expect(starts.at(-1)?.toISOString()).toBe(iso("2026-11-17T14:00"));
  });

  it("7 / 30 days: one bucket per shop day", () => {
    const week = bucketStarts(RANGE_BUCKET["7d"], reportWindow("7d", at));
    expect(week).toHaveLength(7);
    expect(week[0].toISOString()).toBe(iso("2026-11-11T00:00"));
    expect(week.at(-1)?.toISOString()).toBe(iso("2026-11-17T00:00"));
    const month = bucketStarts(RANGE_BUCKET["30d"], reportWindow("30d", at));
    expect(month).toHaveLength(30);
    expect(month[0].toISOString()).toBe(iso("2026-10-19T00:00"));
  });

  it("365 days: 13 month buckets, the first a partial month starting at `from`", () => {
    const starts = bucketStarts(RANGE_BUCKET["365d"], reportWindow("365d", at));
    expect(starts).toHaveLength(13);
    expect(starts[0].toISOString()).toBe(iso("2025-11-18T00:00"));
    expect(starts[1].toISOString()).toBe(iso("2025-12-01T00:00"));
    expect(starts[2].toISOString()).toBe(iso("2026-01-01T00:00"));
    expect(starts.at(-1)?.toISOString()).toBe(iso("2026-11-01T00:00"));
  });

  it("365 days starting on the 1st has 12 whole months", () => {
    const starts = bucketStarts("month", reportWindow("365d", vn("2026-12-31T10:00")));
    expect(starts[0].toISOString()).toBe(iso("2026-01-01T00:00"));
    expect(starts).toHaveLength(12);
  });

  it("month edges use the shop time zone (VN midnight on the 1st is still the last day in UTC)", () => {
    const starts = bucketStarts("month", { from: vn("2026-01-20T00:00"), to: vn("2026-03-05T00:00") });
    expect(starts.map((d) => d.toISOString())).toEqual([iso("2026-01-20T00:00"), iso("2026-02-01T00:00"), iso("2026-03-01T00:00")]);
    expect(starts[1].toISOString()).toBe("2026-01-31T17:00:00.000Z");
  });
});

describe("bucketKey", () => {
  it("truncates shop-local time and reads it as UTC epoch seconds", () => {
    const key = (local: string) => Date.parse(`${local}:00Z`) / 1000;
    expect(bucketKey("hour", vn("2026-11-17T06:45"))).toBe(key("2026-11-17T06:00"));
    expect(bucketKey("day", vn("2026-11-17T00:15"))).toBe(key("2026-11-17T00:00"));
    expect(bucketKey("month", vn("2026-12-01T00:15"))).toBe(key("2026-12-01T00:00"));
    expect(bucketKey("month", vn("2025-11-18T00:00"))).toBe(key("2025-11-01T00:00"));
  });
});
