import { type NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/session";

/** Optimistic gate for admin pages and APIs; route handlers check the session again. */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/api/admin/login" || isAdminRequest(request)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Vui lòng đăng nhập" } }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/admin", request.url));
}

export const config = {
  matcher: ["/admin/orders/:path*", "/api/admin/:path*"],
};
