import { NextRequest } from "next/server";
import { beforeAll, describe, expect, it } from "vitest";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { proxy } from "./proxy";

beforeAll(() => {
  process.env.SESSION_SECRET = "unit-test-secret-that-is-at-least-32-chars";
});

const request = (path: string, cookie?: string) =>
  new NextRequest(`http://localhost:3000${path}`, cookie ? { headers: { cookie: `${SESSION_COOKIE}=${cookie}` } } : undefined);

describe("proxy", () => {
  it("redirects admin pages to the login page without a session", () => {
    const response = proxy(request("/admin/orders"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/admin");
  });

  it("returns 401 for admin APIs without a valid session", async () => {
    const response = proxy(request("/api/admin/orders", "123.forged"));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: { code: "UNAUTHORIZED", message: "Vui lòng đăng nhập" } });
  });

  it("lets the login API through", () => {
    expect(proxy(request("/api/admin/login")).headers.get("x-middleware-next")).toBe("1");
  });

  it("lets a valid session through", () => {
    const token = createSessionToken();
    expect(proxy(request("/admin/orders", token)).headers.get("x-middleware-next")).toBe("1");
    expect(proxy(request("/api/admin/orders/BN-1001", token)).headers.get("x-middleware-next")).toBe("1");
  });
});
