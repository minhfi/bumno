import { unstable_rethrow } from "next/navigation";
import { type NextRequest, NextResponse } from "next/server";
import type { ApiErrorBody, ApiErrorCode } from "@/lib/orders/types";

export function errorResponse(
  status: number,
  code: ApiErrorCode,
  message: string,
  fields?: Record<string, string>,
): NextResponse<ApiErrorBody> {
  return NextResponse.json({ error: { code, message, ...(fields ? { fields } : {}) } }, { status });
}

export const unauthorized = () => errorResponse(401, "UNAUTHORIZED", "Vui lòng đăng nhập");

export const invalidJson = () => errorResponse(400, "VALIDATION", "Dữ liệu gửi lên không hợp lệ");

/** Parses the JSON body; returns undefined when it is not valid JSON. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

/**
 * Client IP for rate limiting, taken from the right of `x-forwarded-for`.
 * Each trusted reverse proxy appends the address it saw, so the entry `TRUSTED_PROXY_COUNT` places from the
 * right cannot be forged by the client (default 1: one proxy, or Next.js itself, which fills the header with
 * the socket address when the client sent none). Entries further left are client-controlled and ignored.
 * Note: when the app is reachable directly (no proxy), a client that sends its own header can still pick its key.
 */
export function getClientIp(request: Request): string {
  const hops = Math.max(1, Number.parseInt(process.env.TRUSTED_PROXY_COUNT ?? "", 10) || 1);
  const chain = (request.headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return chain[Math.max(0, chain.length - hops)] ?? "unknown";
}

type RouteHandler<Args extends unknown[]> = (request: NextRequest, ...args: Args) => Promise<Response>;

/**
 * Turns unexpected errors (e.g. the database is down) into a 500 with the shared error shape and logs one
 * structured line without request data.
 */
export function withErrorHandling<Args extends unknown[]>(route: string, handler: RouteHandler<Args>): RouteHandler<Args> {
  return async (request, ...args) => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      // Next.js signals prerender bail-outs, redirects, etc. by throwing; those must reach the framework.
      unstable_rethrow(error);
      console.error(
        JSON.stringify({
          level: "error",
          route,
          method: request.method,
          error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
        }),
      );
      return errorResponse(500, "INTERNAL", "Có lỗi xảy ra. Vui lòng thử lại.");
    }
  };
}
