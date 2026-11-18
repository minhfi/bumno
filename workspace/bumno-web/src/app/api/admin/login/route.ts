import { type NextRequest, NextResponse } from "next/server";
import { checkAdminCredentials, createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";
import { errorResponse, getClientIp, invalidJson, readJson, withErrorHandling } from "@/lib/http";
import { fieldErrors, loginSchema } from "@/lib/orders/schema";
import { GLOBAL_LOGIN_KEY, globalLoginRateLimiter, loginRateLimiter } from "@/lib/rate-limit";

export const POST = withErrorHandling("POST /api/admin/login", async (request: NextRequest) => {
  const ip = getClientIp(request);
  if (loginRateLimiter.isLimited(ip) || globalLoginRateLimiter.isLimited(GLOBAL_LOGIN_KEY)) {
    return errorResponse(429, "RATE_LIMITED", "Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.");
  }

  const body = await readJson(request);
  if (body === undefined) return invalidJson();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(400, "VALIDATION", "Vui lòng nhập tên đăng nhập và mật khẩu", fieldErrors(parsed.error));
  }

  if (!checkAdminCredentials(parsed.data.username, parsed.data.password)) {
    loginRateLimiter.hit(ip);
    globalLoginRateLimiter.hit(GLOBAL_LOGIN_KEY);
    return errorResponse(401, "INVALID_PASSWORD", "Tên đăng nhập hoặc mật khẩu không đúng");
  }

  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(SESSION_COOKIE, createSessionToken(), sessionCookieOptions);
  return response;
});
