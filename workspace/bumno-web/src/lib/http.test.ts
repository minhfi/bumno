import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getClientIp, withErrorHandling } from "./http";

const withForwardedFor = (value?: string) =>
  new Request("http://localhost/api/orders", value === undefined ? undefined : { headers: { "x-forwarded-for": value } });

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("getClientIp", () => {
  it("uses the right-most entry, which the client cannot forge behind one proxy", () => {
    expect(getClientIp(withForwardedFor("10.0.0.1"))).toBe("10.0.0.1");
    expect(getClientIp(withForwardedFor("6.6.6.6, 203.0.113.7"))).toBe("203.0.113.7");
    expect(getClientIp(withForwardedFor("1.1.1.1, 2.2.2.2 ,  203.0.113.7 "))).toBe("203.0.113.7");
  });

  it("skips TRUSTED_PROXY_COUNT hops from the right", () => {
    vi.stubEnv("TRUSTED_PROXY_COUNT", "2");
    expect(getClientIp(withForwardedFor("6.6.6.6, 203.0.113.7, 10.0.0.2"))).toBe("203.0.113.7");
    expect(getClientIp(withForwardedFor("203.0.113.7"))).toBe("203.0.113.7");
  });

  it("falls back to one hop for invalid config and to 'unknown' without the header", () => {
    vi.stubEnv("TRUSTED_PROXY_COUNT", "abc");
    expect(getClientIp(withForwardedFor("6.6.6.6, 203.0.113.7"))).toBe("203.0.113.7");
    expect(getClientIp(withForwardedFor())).toBe("unknown");
    expect(getClientIp(withForwardedFor(" , "))).toBe("unknown");
  });
});

describe("withErrorHandling", () => {
  it("passes responses through", async () => {
    const handler = withErrorHandling("GET /x", async () => new Response("ok", { status: 200 }));
    expect((await handler(new NextRequest("http://localhost/x"))).status).toBe(200);
  });

  it("returns 500 in the shared error shape and logs one line without request data", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const handler = withErrorHandling("POST /api/orders", async () => {
      throw new Error("connection refused");
    });
    const response = await handler(new NextRequest("http://localhost/api/orders", { method: "POST", body: '{"phone":"0901234567"}' }));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: { code: "INTERNAL", message: "Có lỗi xảy ra. Vui lòng thử lại." } });
    expect(log).toHaveBeenCalledTimes(1);
    const line = JSON.parse(String(log.mock.calls[0][0]));
    expect(line).toEqual({ level: "error", route: "POST /api/orders", method: "POST", error: "Error: connection refused" });
  });

  it("rethrows Next.js control-flow errors instead of turning them into a 500", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const handler = withErrorHandling("GET /x", async () => redirect("/admin"));
    await expect(handler(new NextRequest("http://localhost/x"))).rejects.toThrow("NEXT_REDIRECT");
    expect(log).not.toHaveBeenCalled();
  });
});
