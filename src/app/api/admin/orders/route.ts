import { type NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/session";
import { now } from "@/lib/clock";
import { errorResponse, unauthorized } from "@/lib/http";
import { fieldErrors, listOrdersQuerySchema } from "@/lib/orders/schema";
import { listOrders } from "@/lib/orders/service";
import { shopDateString, shopDayRange } from "@/lib/orders/slots";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();

  const params = request.nextUrl.searchParams;
  const parsed = listOrdersQuerySchema.safeParse({
    date: params.get("date") || undefined,
    status: params.get("status") || undefined,
    q: params.get("q") || undefined,
    page: params.get("page") || undefined,
  });
  if (!parsed.success) {
    return errorResponse(400, "VALIDATION", "Bộ lọc không hợp lệ", fieldErrors(parsed.error));
  }

  const { date = shopDateString(now()), status, q, page } = parsed.data;
  const range = shopDayRange(date);
  if (!range) return errorResponse(400, "VALIDATION", "Bộ lọc không hợp lệ", { date: "Ngày không hợp lệ" });

  return NextResponse.json(await listOrders({ range, status, q: q || undefined, page }));
}
