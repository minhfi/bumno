import { NextResponse } from "next/server";
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

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
