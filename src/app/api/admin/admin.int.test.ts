import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { resetState } from "../../../../test/db";
import { POST as login } from "./login/route";
import { POST as logout } from "./logout/route";
import { GET as getOrder, PATCH as patchOrder } from "./orders/[code]/route";
import { GET as listOrders } from "./orders/route";

const NOW = "2026-11-09T09:00:00+07:00";

function req(path: string, init: { method?: string; body?: unknown; auth?: boolean; ip?: string } = {}) {
  const headers: Record<string, string> = { "x-forwarded-for": init.ip ?? "10.1.0.1" };
  if (init.body !== undefined) headers["content-type"] = "application/json";
  if (init.auth !== false) headers.cookie = `${SESSION_COOKIE}=${createSessionToken()}`;
  return new NextRequest(`http://localhost${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}

const ctx = (code: string) => ({ params: Promise.resolve({ code }) });

async function seedOrder(overrides: Partial<{ createdAt: Date; phone: string; status: "NEW" | "CONFIRMED" | "DELIVERING" | "COMPLETED" | "CANCELLED" }> = {}) {
  return db.order.create({
    data: {
      customerName: "Khách",
      phone: overrides.phone ?? "0901234567",
      address: "1 Đường A",
      deliverySlot: new Date("2026-11-09T02:00:00Z"),
      total: 35_000,
      status: overrides.status ?? "NEW",
      createdAt: overrides.createdAt ?? new Date("2026-11-09T01:00:00Z"),
      items: { create: [{ productId: "phan-thuong", name: "Phần thường", unitPrice: 35_000, quantity: 1 }] },
    },
  });
}

beforeEach(async () => {
  await resetState();
  vi.stubEnv("BUMNO_FAKE_NOW", NOW);
});

afterAll(async () => {
  vi.unstubAllEnvs();
  await db.$disconnect();
});

describe("POST /api/admin/login", () => {
  it("204 + HttpOnly session cookie for the right password", async () => {
    const response = await login(req("/api/admin/login", { method: "POST", body: { username: "test-admin", password: "test-admin-password" }, auth: false }));
    expect(response.status).toBe(204);
    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toContain(`${SESSION_COOKIE}=`);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=lax/i);
    expect(cookie).toMatch(/Max-Age=604800/);
  });

  it("400 without credentials, 401 for a wrong password or username", async () => {
    expect((await login(req("/api/admin/login", { method: "POST", body: {}, auth: false }))).status).toBe(400);
    const response = await login(req("/api/admin/login", { method: "POST", body: { username: "test-admin", password: "sai" }, auth: false }));
    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("INVALID_PASSWORD");
    const wrongUser = await login(req("/api/admin/login", { method: "POST", body: { username: "khac", password: "test-admin-password" }, auth: false }));
    expect(wrongUser.status).toBe(401);
  });

  it("429 after 5 wrong passwords from one IP", async () => {
    for (let i = 0; i < 5; i++) {
      expect((await login(req("/api/admin/login", { method: "POST", body: { username: "test-admin", password: "sai" }, auth: false, ip: "10.1.0.7" }))).status).toBe(401);
    }
    const blocked = await login(req("/api/admin/login", { method: "POST", body: { username: "test-admin", password: "test-admin-password" }, auth: false, ip: "10.1.0.7" }));
    expect(blocked.status).toBe(429);
  });

  it("429 for everyone after 30 wrong passwords in total, even from rotating IPs", async () => {
    for (let i = 0; i < 30; i++) {
      expect((await login(req("/api/admin/login", { method: "POST", body: { username: "test-admin", password: "sai" }, auth: false, ip: `10.2.${i}.1` }))).status).toBe(401);
    }
    const blocked = await login(req("/api/admin/login", { method: "POST", body: { username: "test-admin", password: "test-admin-password" }, auth: false, ip: "10.3.0.1" }));
    expect(blocked.status).toBe(429);
  });
});

describe("POST /api/admin/logout", () => {
  it("clears the cookie, 401 without a session", async () => {
    const response = await logout(req("/api/admin/logout", { method: "POST" }));
    expect(response.status).toBe(204);
    expect(response.headers.get("set-cookie")).toMatch(/Max-Age=0/);
    expect((await logout(req("/api/admin/logout", { method: "POST", auth: false }))).status).toBe(401);
  });
});

describe("GET /api/admin/orders", () => {
  it("401 without a session", async () => {
    expect((await listOrders(req("/api/admin/orders", { auth: false }))).status).toBe(401);
  });

  it("defaults to today (Vietnam time) and filters by status", async () => {
    await seedOrder();
    await seedOrder({ status: "COMPLETED" });
    await seedOrder({ createdAt: new Date("2026-11-08T16:30:00Z") }); // 23:30 on 8/11 in Vietnam

    const today = await (await listOrders(req("/api/admin/orders"))).json();
    expect(today).toMatchObject({ page: 1, pageSize: 20, total: 2 });
    expect(Object.keys(today.items[0]).sort()).toEqual(["code", "createdAt", "customerName", "deliverySlot", "phone", "status", "total"]);

    const yesterday = await (await listOrders(req("/api/admin/orders?date=2026-11-08"))).json();
    expect(yesterday.items.map((o: { code: string }) => o.code)).toEqual(["BN-1003"]);

    const completed = await (await listOrders(req("/api/admin/orders?status=COMPLETED"))).json();
    expect(completed.items.map((o: { code: string }) => o.code)).toEqual(["BN-1002"]);
  });

  it("searches by phone or code", async () => {
    await seedOrder({ phone: "0901111111" });
    await seedOrder({ phone: "0902222222" });
    const byPhone = await (await listOrders(req("/api/admin/orders?q=0902%20222"))).json();
    expect(byPhone.items.map((o: { code: string }) => o.code)).toEqual(["BN-1002"]);
    const byCode = await (await listOrders(req("/api/admin/orders?q=bn-1001"))).json();
    expect(byCode.items.map((o: { code: string }) => o.code)).toEqual(["BN-1001"]);
    const nothing = await (await listOrders(req("/api/admin/orders?q=abc"))).json();
    expect(nothing.total).toBe(0);
  });

  it("paginates 20 per page, newest first", async () => {
    for (let i = 0; i < 23; i++) await seedOrder({ createdAt: new Date(Date.UTC(2026, 10, 9, 0, i)) });
    const page1 = await (await listOrders(req("/api/admin/orders"))).json();
    const page2 = await (await listOrders(req("/api/admin/orders?page=2"))).json();
    expect(page1.items).toHaveLength(20);
    expect(page1.items[0].code).toBe("BN-1023");
    expect(page2).toMatchObject({ page: 2, total: 23 });
    expect(page2.items).toHaveLength(3);
  });

  it("400 for bad filters", async () => {
    expect((await listOrders(req("/api/admin/orders?date=2026-13-01"))).status).toBe(400);
    expect((await listOrders(req("/api/admin/orders?status=PAID"))).status).toBe(400);
    expect((await listOrders(req("/api/admin/orders?page=0"))).status).toBe(400);
  });
});

describe("GET/PATCH /api/admin/orders/:code", () => {
  it("returns the order detail, 404 for unknown codes, 401 without session", async () => {
    await seedOrder();
    const response = await getOrder(req("/api/admin/orders/BN-1001"), ctx("BN-1001"));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      code: "BN-1001",
      address: "1 Đường A",
      note: null,
      internalNote: null,
      items: [{ productId: "phan-thuong", name: "Phần thường", unitPrice: 35_000, quantity: 1 }],
      updatedAt: expect.any(String),
    });
    expect((await getOrder(req("/api/admin/orders/BN-9999"), ctx("BN-9999"))).status).toBe(404);
    expect((await getOrder(req("/api/admin/orders/xyz"), ctx("xyz"))).status).toBe(404);
    expect((await getOrder(req("/api/admin/orders/BN-1001", { auth: false }), ctx("BN-1001"))).status).toBe(401);
  });

  it("moves status forward one step and saves the internal note", async () => {
    await seedOrder();
    const patch = (body: unknown) => patchOrder(req("/api/admin/orders/BN-1001", { method: "PATCH", body }), ctx("BN-1001"));
    const confirmed = await patch({ status: "CONFIRMED", internalNote: "Đã gọi" });
    expect(confirmed.status).toBe(200);
    expect(await confirmed.json()).toMatchObject({ status: "CONFIRMED", internalNote: "Đã gọi" });
    expect((await (await patch({ internalNote: "" })).json()).internalNote).toBeNull();
    expect((await patch({ status: "DELIVERING" })).status).toBe(200);
    expect((await patch({ status: "COMPLETED" })).status).toBe(200);
  });

  it("409 INVALID_TRANSITION for skipped steps and final states", async () => {
    await seedOrder();
    await seedOrder({ status: "COMPLETED" });
    const skip = await patchOrder(req("/api/admin/orders/BN-1001", { method: "PATCH", body: { status: "DELIVERING" } }), ctx("BN-1001"));
    expect(skip.status).toBe(409);
    expect((await skip.json()).error.code).toBe("INVALID_TRANSITION");
    const cancelFinal = await patchOrder(req("/api/admin/orders/BN-1002", { method: "PATCH", body: { status: "CANCELLED" } }), ctx("BN-1002"));
    expect(cancelFinal.status).toBe(409);
    expect((await db.order.findUniqueOrThrow({ where: { number: 1001 } })).status).toBe("NEW");
  });

  it("cancels before completion", async () => {
    await seedOrder({ status: "DELIVERING" });
    const response = await patchOrder(req("/api/admin/orders/BN-1001", { method: "PATCH", body: { status: "CANCELLED" } }), ctx("BN-1001"));
    expect((await response.json()).status).toBe("CANCELLED");
  });

  describe("editing address and items", () => {
    const patch = (body: unknown, code = "BN-1001") =>
      patchOrder(req(`/api/admin/orders/${code}`, { method: "PATCH", body }), ctx(code));
    const lineOf = (order: { items: { productId: string }[] }, productId: string) =>
      order.items.find((item) => item.productId === productId);

    it("changes the address and items, keeps old prices, prices new items from the menu and recomputes the total", async () => {
      await seedOrder(); // 1 x phan-thuong @ 35.000 (stored), menu price is the same today
      await db.orderItem.updateMany({ where: { productId: "phan-thuong" }, data: { unitPrice: 30_000 } });
      const response = await patch({
        address: "  99 Nguyễn Huệ, Quận 1 ",
        items: [
          { productId: "phan-thuong", quantity: 2 },
          { productId: "them-banh", quantity: 1 },
        ],
      });
      expect(response.status).toBe(200);
      const order = await response.json();
      expect(order.address).toBe("99 Nguyễn Huệ, Quận 1");
      expect(lineOf(order, "phan-thuong")).toMatchObject({ unitPrice: 30_000, quantity: 2 });
      expect(lineOf(order, "them-banh")).toMatchObject({ name: "Thêm bánh", unitPrice: 10_000, quantity: 1 });
      expect(order.total).toBe(70_000);
      expect((await db.order.findUniqueOrThrow({ where: { number: 1001 } })).total).toBe(70_000);
      expect(await db.orderItem.count()).toBe(2);
    });

    it("removes lines set to 0 and edits a CONFIRMED order", async () => {
      await seedOrder({ status: "CONFIRMED" });
      const response = await patch({
        items: [
          { productId: "phan-thuong", quantity: 0 },
          { productId: "them-long", quantity: 2 },
        ],
      });
      const order = await response.json();
      expect(response.status).toBe(200);
      expect(order.items).toHaveLength(1);
      expect(order.items[0]).toMatchObject({ productId: "them-long", quantity: 2 });
      expect(order.total).toBe(30_000);
    });

    it("keeps a product that left the menu while it is in the order, but cannot add one", async () => {
      await seedOrder();
      await db.orderItem.updateMany({ data: { productId: "mon-cu", name: "Món cũ", unitPrice: 20_000 } });
      const kept = await patch({ items: [{ productId: "mon-cu", quantity: 3 }] });
      expect(kept.status).toBe(200);
      expect((await kept.json()).total).toBe(60_000);
      const added = await patch({ items: [{ productId: "mon-cu", quantity: 1 }, { productId: "pho-bo", quantity: 1 }] });
      expect(added.status).toBe(400);
      expect((await added.json()).error.fields.items).toBeDefined();
      expect((await db.order.findUniqueOrThrow({ where: { number: 1001 } })).total).toBe(60_000);
    });

    it("409 NOT_EDITABLE once the order is out for delivery, completed or cancelled", async () => {
      for (const [index, status] of (["DELIVERING", "COMPLETED", "CANCELLED"] as const).entries()) {
        await seedOrder({ status });
        const code = `BN-${1001 + index}`;
        const address = await patch({ address: "99 Nguyễn Huệ, Quận 1" }, code);
        expect(address.status, status).toBe(409);
        expect((await address.json()).error.code).toBe("NOT_EDITABLE");
        expect((await patch({ items: [{ productId: "them-banh", quantity: 1 }] }, code)).status, status).toBe(409);
      }
      expect((await db.order.findUniqueOrThrow({ where: { number: 1001 } })).address).toBe("1 Đường A");
    });

    it("400 for invalid edits and for a status change combined with an edit; the order stays untouched", async () => {
      await seedOrder();
      for (const body of [
        { address: "abc" },
        { items: [] },
        { items: [{ productId: "phan-thuong", quantity: 0 }] },
        { items: [{ productId: "phan-thuong", quantity: 21 }] },
        { status: "CONFIRMED", address: "99 Nguyễn Huệ, Quận 1" },
      ]) {
        expect((await patch(body)).status, JSON.stringify(body)).toBe(400);
      }
      const order = await db.order.findUniqueOrThrow({ where: { number: 1001 }, include: { items: true } });
      expect(order).toMatchObject({ address: "1 Đường A", total: 35_000, status: "NEW" });
      expect(order.items).toHaveLength(1);
    });

    it("404 for an unknown order and 401 without a session", async () => {
      expect((await patch({ address: "99 Nguyễn Huệ, Quận 1" }, "BN-4040")).status).toBe(404);
      await seedOrder();
      const noAuth = await patchOrder(
        req("/api/admin/orders/BN-1001", { method: "PATCH", body: { address: "99 Nguyễn Huệ, Quận 1" }, auth: false }),
        ctx("BN-1001"),
      );
      expect(noAuth.status).toBe(401);
    });
  });

  it("400 for an empty or invalid body, 404 for unknown code, 401 without session", async () => {
    await seedOrder();
    expect((await patchOrder(req("/api/admin/orders/BN-1001", { method: "PATCH", body: {} }), ctx("BN-1001"))).status).toBe(400);
    expect((await patchOrder(req("/api/admin/orders/BN-1001", { method: "PATCH", body: { status: "PAID" } }), ctx("BN-1001"))).status).toBe(400);
    expect((await patchOrder(req("/api/admin/orders/BN-4040", { method: "PATCH", body: { internalNote: "x" } }), ctx("BN-4040"))).status).toBe(404);
    expect((await patchOrder(req("/api/admin/orders/BN-1001", { method: "PATCH", body: { internalNote: "x" }, auth: false }), ctx("BN-1001"))).status).toBe(401);
  });
});
