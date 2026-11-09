import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { resetState } from "../../../../test/db";
import { POST } from "./route";

const OPEN_NOW = "2026-11-09T07:10:00+07:00";

const validOrder = {
  customerName: "Nguyễn Lan",
  phone: "0901234567",
  address: "12 Lê Lợi, Quận 1",
  deliverySlot: "2026-11-09T08:00:00+07:00",
  note: "Ít hành",
  items: [
    { productId: "phan-thuong", quantity: 2, unitPrice: 1 },
    { productId: "them-long", quantity: 1 },
  ],
  website: "",
};

function post(body: unknown, ip = "10.0.0.1") {
  return POST(
    new NextRequest("http://localhost/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

beforeEach(async () => {
  await resetState();
  vi.stubEnv("BUMNO_FAKE_NOW", OPEN_NOW);
});

afterAll(async () => {
  vi.unstubAllEnvs();
  await db.$disconnect();
});

describe("POST /api/orders", () => {
  it("201: creates the order with server-side prices", async () => {
    const response = await post(validOrder);
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      code: "BN-1001",
      total: 85_000,
      deliverySlot: "2026-11-09T01:00:00.000Z",
      items: [
        { name: "Phần thường", unitPrice: 35_000, quantity: 2 },
        { name: "Thêm lòng", unitPrice: 15_000, quantity: 1 },
      ],
    });
    const saved = await db.order.findUniqueOrThrow({ where: { number: 1001 }, include: { items: true } });
    expect(saved).toMatchObject({ status: "NEW", total: 85_000, phone: "0901234567", note: "Ít hành" });
    expect(saved.createdAt.toISOString()).toBe(new Date(OPEN_NOW).toISOString());
    expect(saved.items).toHaveLength(2);
  });

  it("400: returns Vietnamese field errors", async () => {
    const response = await post({ ...validOrder, phone: "12345", items: [{ productId: "phan-thuong", quantity: 0 }] });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION");
    expect(body.error.fields).toMatchObject({
      phone: "Số điện thoại gồm 10 số, bắt đầu bằng 0",
      items: "Chọn ít nhất 1 món",
    });
  });

  it("400: rejects invalid JSON and a filled honeypot", async () => {
    expect((await post("{not json")).status).toBe(400);
    const response = await post({ ...validOrder, website: "spam" });
    expect(response.status).toBe(400);
    expect(await db.order.count()).toBe(0);
  });

  it("409 SHOP_CLOSED outside opening hours", async () => {
    vi.stubEnv("BUMNO_FAKE_NOW", "2026-11-09T13:00:00+07:00");
    const response = await post({ ...validOrder, deliverySlot: "2026-11-09T14:00:00+07:00" });
    expect(response.status).toBe(409);
    expect((await response.json()).error.code).toBe("SHOP_CLOSED");
  });

  it("409 SLOT_UNAVAILABLE for a past or too-soon slot", async () => {
    for (const deliverySlot of ["2026-11-09T07:00:00+07:00", "2026-11-09T07:30:00+07:00", "2026-11-10T08:00:00+07:00"]) {
      const response = await post({ ...validOrder, deliverySlot });
      expect(response.status, deliverySlot).toBe(409);
      expect((await response.json()).error).toMatchObject({ code: "SLOT_UNAVAILABLE", fields: { deliverySlot: expect.any(String) } });
    }
  });

  it("429 after 5 orders from the same IP in 10 minutes", async () => {
    for (let i = 0; i < 5; i++) expect((await post(validOrder, "10.0.0.9")).status).toBe(201);
    const response = await post(validOrder, "10.0.0.9");
    expect(response.status).toBe(429);
    expect((await response.json()).error.code).toBe("RATE_LIMITED");
    expect((await post(validOrder, "10.0.0.10")).status).toBe(201);
  });

  it("429 after 20 rejected requests from the same IP in 10 minutes", async () => {
    for (let i = 0; i < 20; i++) expect((await post({ ...validOrder, phone: "123" }, "10.0.0.11")).status).toBe(400);
    const response = await post(validOrder, "10.0.0.11");
    expect(response.status).toBe(429);
    expect(await db.order.count()).toBe(0);
  });

  it("rate-limits by the right-most X-Forwarded-For entry, ignoring client-supplied ones", async () => {
    for (let i = 0; i < 5; i++) expect((await post(validOrder, `6.6.6.${i}, 10.0.0.12`)).status).toBe(201);
    expect((await post(validOrder, "6.6.6.99, 10.0.0.12")).status).toBe(429);
  });
});
