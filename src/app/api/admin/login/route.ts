import { type NextRequest, NextResponse } from "next/server";
import { checkAdminPassword, createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";
import { errorResponse, getClientIp, invalidJson, readJson } from "@/lib/http";
import { fieldErrors, loginSchema } from "@/lib/orders/schema";
import { loginRateLimiter } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (loginRateLimiter.isLimited(ip)) {
    return errorResponse(429, "RATE_LIMITED", "Sai mật khẩu quá nhiều lần. Vui lòng thử lại sau 15 phút.");
  }

  const body = await readJson(request);
  if (body === undefined) return invalidJson();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(400, "VALIDATION", "Vui lòng nhập mật khẩu", fieldErrors(parsed.error));
  }

  if (!checkAdminPassword(parsed.data.password)) {
    loginRateLimiter.hit(ip);
    return errorResponse(401, "INVALID_PASSWORD", "Mật khẩu không đúng");
  }

  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(SESSION_COOKIE, createSessionToken(), sessionCookieOptions);
  return response;
}
