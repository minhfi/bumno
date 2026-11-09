import { type NextRequest, NextResponse } from "next/server";
import { isAdminRequest, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";
import { unauthorized } from "@/lib/http";

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  return response;
}
