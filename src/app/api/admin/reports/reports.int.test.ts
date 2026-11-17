import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { db } from "@/lib/db";
import type { ReportResponse } from "@/lib/reports/types";
import { resetState } from "../../../../../test/db";
import { GET } from "./route";

const NOW = "2026-11-17T07:00:00+07:00";

/** A time in Asia/Ho_Chi_Minh. */
const vn = (local: string) => new Date(`${local}:00+07:00`);

type Status = "NEW" | "CONFIRMED" | "DELIVERING" | "COMPLETED" | "CANCELLED";
type Line = { productId: string; name: string; unitPrice: number; quantity: number };

const regular = (quantity = 1): Line => ({ productId: "phan-thuong", name: "Phần thường", unitPrice: 35_000, quantity });
const special = (quantity = 1): Line => ({ productId: "phan-dac-biet", name: "Phần đặc biệt", unitPrice: 50_000, quantity });
const extraBanh = (quantity = 1): Line => ({ productId: "them-banh", name: "Thêm bánh", unitPrice: 10_000, quantity });

async function seedOrder(slot: string, status: Status, lines: Line[] = [regular()]) {
  return db.order.create({
    data: {
      customerName: "Khách",
      phone: "0901234567",
      address: "1 Đường A",
      deliverySlot: vn(slot),
      status,
      total: lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
      items: { create: lines },
    },
  });
}

function req(query: string, auth = true) {
  return new NextRequest(`http://localhost/api/admin/reports${query}`, {
    headers: auth ? { cookie: `${SESSION_COOKIE}=${createSessionToken()}` } : {},
  });
}

async function report(range?: string): Promise<ReportResponse> {
  const response = await GET(req(range ? `?range=${range}` : ""));
  expect(response.status).toBe(200);
  return response.json();
}

beforeEach(async () => {
  await resetState();
  vi.stubEnv("BUMNO_FAKE_NOW", NOW);
});

afterAll(async () => {
  vi.unstubAllEnvs();
  await db.$disconnect();
});

describe("GET /api/admin/reports", () => {
  it("401 without a session", async () => {
    const response = await GET(req("?range=7d", false));
    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("UNAUTHORIZED");
  });

  it("400 for an unknown range", async () => {
    const response = await GET(req("?range=90d"));
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("VALIDATION");
  });

  it("zeros and every bucket when there are no orders; defaults to today", async () => {
    const data = await report();
    expect(data.range).toBe("today");
    expect(data.bucket).toBe("hour");
    expect(data.from).toBe(vn("2026-11-17T00:00").toISOString());
    expect(data.to).toBe(vn("2026-11-18T00:00").toISOString());
    expect(data.current).toEqual({ revenue: 0, completedOrders: 0, averageOrderValue: 0, cancelledOrders: 0, cancelRate: 0 });
    expect(data.pending).toEqual({ orders: 0, total: 0 });
    expect(data.series).toHaveLength(14);
    expect(data.series.every((point) => point.revenue === 0 && point.completedOrders === 0)).toBe(true);
    expect(data.items).toEqual([]);
  });

  it("today: COMPLETED revenue per hour, pending, cancel rate; tomorrow and yesterday excluded", async () => {
    await seedOrder("2026-11-17T06:00", "COMPLETED", [regular(2)]); // 70k
    await seedOrder("2026-11-17T06:30", "COMPLETED", [special()]); // 50k
    await seedOrder("2026-11-17T19:30", "COMPLETED", [regular()]); // 35k
    await seedOrder("2026-11-17T08:00", "NEW", [special()]);
    await seedOrder("2026-11-17T09:00", "DELIVERING", [regular()]);
    await seedOrder("2026-11-17T10:00", "CANCELLED", [regular()]);
    await seedOrder("2026-11-18T06:00", "COMPLETED", [special(5)]); // tomorrow
    await seedOrder("2026-11-16T23:59", "COMPLETED", [regular()]); // yesterday (previous period)

    const data = await report("today");
    expect(data.current).toEqual({
      revenue: 155_000,
      completedOrders: 3,
      averageOrderValue: 51_667,
      cancelledOrders: 1,
      cancelRate: 1 / 6,
    });
    expect(data.pending).toEqual({ orders: 2, total: 85_000 });
    expect(data.previous.revenue).toBe(35_000);
    expect(data.previous.completedOrders).toBe(1);

    const hour = (h: number) => data.series.find((p) => p.start === vn(`2026-11-17T${String(h).padStart(2, "0")}:00`).toISOString());
    expect(hour(6)).toEqual({ start: vn("2026-11-17T06:00").toISOString(), revenue: 120_000, completedOrders: 2 });
    expect(hour(19)?.revenue).toBe(35_000);
    expect(data.series.reduce((sum, p) => sum + p.revenue, 0)).toBe(155_000);
  });

  it("7d: per-day series and previous week", async () => {
    await seedOrder("2026-11-11T00:00", "COMPLETED", [regular()]); // first day, VN midnight
    await seedOrder("2026-11-17T12:00", "COMPLETED", [special()]);
    await seedOrder("2026-11-10T23:30", "COMPLETED", [special(2)]); // previous period
    await seedOrder("2026-11-04T00:00", "CANCELLED", [regular()]); // previous period

    const data = await report("7d");
    expect(data.bucket).toBe("day");
    expect(data.series).toHaveLength(7);
    expect(data.series[0]).toEqual({ start: vn("2026-11-11T00:00").toISOString(), revenue: 35_000, completedOrders: 1 });
    expect(data.series[6].revenue).toBe(50_000);
    expect(data.current.revenue).toBe(85_000);
    expect(data.previous).toEqual({ revenue: 100_000, completedOrders: 1, averageOrderValue: 100_000, cancelledOrders: 1, cancelRate: 0.5 });
  });

  it("30d: one bucket per day", async () => {
    await seedOrder("2026-10-19T08:00", "COMPLETED", [regular()]);
    await seedOrder("2026-10-18T08:00", "COMPLETED", [regular()]); // outside
    const data = await report("30d");
    expect(data.series).toHaveLength(30);
    expect(data.series[0].revenue).toBe(35_000);
    expect(data.current.revenue).toBe(35_000);
  });

  it("365d: 13 month buckets, the first partial; VN month edges", async () => {
    await seedOrder("2025-11-18T06:00", "COMPLETED", [regular()]); // first day of the range
    await seedOrder("2025-11-17T19:30", "COMPLETED", [regular()]); // the day before: previous period
    await seedOrder("2025-12-01T06:00", "COMPLETED", [special()]); // 1 Dec VN = 30 Nov 23:00 UTC
    await seedOrder("2025-11-30T19:30", "COMPLETED", [regular(2)]);
    await seedOrder("2026-11-17T06:00", "COMPLETED", [special(2)]);

    const data = await report("365d");
    expect(data.bucket).toBe("month");
    expect(data.series).toHaveLength(13);
    expect(data.series[0]).toEqual({ start: vn("2025-11-18T00:00").toISOString(), revenue: 105_000, completedOrders: 2 });
    expect(data.series[1]).toEqual({ start: vn("2025-12-01T00:00").toISOString(), revenue: 50_000, completedOrders: 1 });
    expect(data.series[12].revenue).toBe(100_000);
    expect(data.current.revenue).toBe(255_000);
    expect(data.previous.revenue).toBe(35_000);
  });

  it("items: COMPLETED only, sorted by revenue, add-on flag, shares, sums to revenue, stored name kept", async () => {
    await seedOrder("2026-11-15T08:00", "COMPLETED", [regular(2), extraBanh(3)]);
    await seedOrder("2026-11-16T08:00", "COMPLETED", [special(), { productId: "mon-cu", name: "Món cũ", unitPrice: 20_000, quantity: 1 }]);
    await seedOrder("2026-11-17T08:00", "COMPLETED", [{ ...regular(), name: "Phần thường (mới)" }]);
    await seedOrder("2026-11-17T09:00", "CANCELLED", [special(4)]);

    const data = await report("7d");
    expect(data.items.map((item) => [item.productId, item.name, item.addon, item.quantity, item.revenue])).toEqual([
      ["phan-thuong", "Phần thường (mới)", false, 3, 105_000],
      ["phan-dac-biet", "Phần đặc biệt", false, 1, 50_000],
      ["them-banh", "Thêm bánh", true, 3, 30_000],
      ["mon-cu", "Món cũ", false, 1, 20_000],
    ]);
    expect(data.items.reduce((sum, item) => sum + item.revenue, 0)).toBe(data.current.revenue);
    expect(data.items.reduce((sum, item) => sum + item.share, 0)).toBeCloseTo(1);
    expect(data.items[0].share).toBeCloseTo(105_000 / 205_000);
  });
});
