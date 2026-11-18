import { NextResponse, type NextRequest } from "next/server";
import { now } from "@/lib/clock";
import { errorResponse, getClientIp, invalidJson, readJson, withErrorHandling } from "@/lib/http";
import { createOrderSchema, fieldErrors } from "@/lib/orders/schema";
import { createOrder } from "@/lib/orders/service";
import { isSlotAvailable } from "@/lib/orders/slots";
import type { CreateOrderResponse } from "@/lib/orders/types";
import { orderAttemptRateLimiter, orderRateLimiter } from "@/lib/rate-limit";

const rateLimited = () =>
  errorResponse(429, "RATE_LIMITED", "Bạn đặt quá nhiều đơn trong thời gian ngắn. Vui lòng thử lại sau ít phút.");

export const POST = withErrorHandling("POST /api/orders", async (request: NextRequest) => {
  const ip = getClientIp(request);
  if (orderRateLimiter.isLimited(ip) || orderAttemptRateLimiter.isLimited(ip)) return rateLimited();
  orderAttemptRateLimiter.hit(ip);

  const body = await readJson(request);
  if (body === undefined) return invalidJson();

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(400, "VALIDATION", "Vui lòng kiểm tra lại thông tin đơn hàng", fieldErrors(parsed.error));
  }

  const at = now();
  if (!isSlotAvailable(new Date(parsed.data.deliverySlot), at)) {
    return errorResponse(409, "SLOT_UNAVAILABLE", "Khung giờ này không còn nhận đơn. Vui lòng chọn giờ khác.", {
      deliverySlot: "Khung giờ này không còn nhận đơn",
    });
  }

  orderRateLimiter.hit(ip);
  const order = await createOrder(parsed.data, at);

  const response: CreateOrderResponse = {
    code: order.code,
    total: order.total,
    deliverySlot: order.deliverySlot,
    items: order.items.map(({ name, unitPrice, quantity }) => ({ name, unitPrice, quantity })),
  };
  return NextResponse.json(response, { status: 201 });
});
