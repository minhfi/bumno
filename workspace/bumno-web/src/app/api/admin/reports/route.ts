import { type NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/session";
import { now } from "@/lib/clock";
import { errorResponse, unauthorized, withErrorHandling } from "@/lib/http";
import { fieldErrors } from "@/lib/orders/schema";
import { reportQuerySchema } from "@/lib/reports/schema";
import { getReport } from "@/lib/reports/service";

export const GET = withErrorHandling("GET /api/admin/reports", async (request: NextRequest) => {
  if (!isAdminRequest(request)) return unauthorized();

  const parsed = reportQuerySchema.safeParse({ range: request.nextUrl.searchParams.get("range") || undefined });
  if (!parsed.success) {
    return errorResponse(400, "VALIDATION", "Khoảng thời gian không hợp lệ", fieldErrors(parsed.error));
  }

  return NextResponse.json(await getReport(parsed.data.range, now()));
});
