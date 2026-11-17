import { type NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/session";
import { errorResponse, invalidJson, readJson, unauthorized, withErrorHandling } from "@/lib/http";
import { fieldErrors, updateOrderSchema } from "@/lib/orders/schema";
import { getOrderByCode, updateOrder } from "@/lib/orders/service";
import { STATUS_LABELS } from "@/lib/orders/status";

const notFound = () => errorResponse(404, "NOT_FOUND", "Không tìm thấy đơn hàng");

type Context = RouteContext<"/api/admin/orders/[code]">;

export const GET = withErrorHandling("GET /api/admin/orders/:code", async (request: NextRequest, ctx: Context) => {
  if (!isAdminRequest(request)) return unauthorized();
  const { code } = await ctx.params;
  const order = await getOrderByCode(code);
  return order ? NextResponse.json(order) : notFound();
});

export const PATCH = withErrorHandling("PATCH /api/admin/orders/:code", async (request: NextRequest, ctx: Context) => {
  if (!isAdminRequest(request)) return unauthorized();
  const { code } = await ctx.params;

  const body = await readJson(request);
  if (body === undefined) return invalidJson();
  const parsed = updateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(400, "VALIDATION", "Dữ liệu cập nhật không hợp lệ", fieldErrors(parsed.error));
  }

  const result = await updateOrder(code, parsed.data);
  if (result.ok) return NextResponse.json(result.order);
  if (result.reason === "NOT_FOUND") return notFound();
  if (result.reason === "UNKNOWN_PRODUCT") {
    return errorResponse(400, "VALIDATION", "Dữ liệu cập nhật không hợp lệ", { items: "Món không có trong menu" });
  }
  const from = result.from ? STATUS_LABELS[result.from] : "hiện tại";
  if (result.reason === "NOT_EDITABLE") {
    return errorResponse(409, "NOT_EDITABLE", `Đơn đang ở trạng thái "${from}" nên không sửa địa chỉ hoặc món được nữa`);
  }
  return errorResponse(409, "INVALID_TRANSITION", `Không thể chuyển đơn từ trạng thái "${from}" sang trạng thái này`);
});
