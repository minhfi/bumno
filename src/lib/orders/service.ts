import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { formatOrderCode, parseOrderCode } from "./code";
import { priceOrder } from "./pricing";
import type { CreateOrderData } from "./schema";
import { canTransition } from "./status";
import type { OrderDetail, OrderListResponse, OrderStatus, OrderSummary } from "./types";

export const PAGE_SIZE = 20;

const detailInclude = { items: { orderBy: { id: "asc" } } } satisfies Prisma.OrderInclude;
type OrderRow = Prisma.OrderGetPayload<object>;
type OrderWithItems = Prisma.OrderGetPayload<{ include: typeof detailInclude }>;

function toSummary(order: OrderRow): OrderSummary {
  return {
    code: formatOrderCode(order.number),
    createdAt: order.createdAt.toISOString(),
    customerName: order.customerName,
    phone: order.phone,
    deliverySlot: order.deliverySlot.toISOString(),
    total: order.total,
    status: order.status,
  };
}

function toDetail(order: OrderWithItems): OrderDetail {
  return {
    ...toSummary(order),
    address: order.address,
    note: order.note,
    internalNote: order.internalNote,
    items: order.items.map(({ productId, name, unitPrice, quantity }) => ({ productId, name, unitPrice, quantity })),
    updatedAt: order.updatedAt.toISOString(),
  };
}

export async function createOrder(data: CreateOrderData, createdAt: Date): Promise<OrderDetail> {
  const { lines, total } = priceOrder(data.items);
  const order = await db.order.create({
    data: {
      customerName: data.customerName,
      phone: data.phone,
      address: data.address,
      deliverySlot: new Date(data.deliverySlot),
      note: data.note ?? null,
      total,
      createdAt,
      items: { create: lines },
    },
    include: detailInclude,
  });
  return toDetail(order);
}

export type ListOrdersFilter = {
  range: { start: Date; end: Date };
  status?: OrderStatus;
  q?: string;
  page: number;
};

export async function listOrders({ range, status, q, page }: ListOrdersFilter): Promise<OrderListResponse> {
  const where: Prisma.OrderWhereInput = {
    createdAt: { gte: range.start, lt: range.end },
    ...(status ? { status } : {}),
  };
  if (q) {
    const number = parseOrderCode(q);
    const digits = q.replace(/[\s.-]/g, "");
    where.OR = [
      ...(number !== null ? [{ number }] : []),
      ...(/^\d{3,}$/.test(digits) ? [{ phone: { contains: digits } }] : []),
    ];
    // Search text that is neither a code nor a phone number matches nothing.
    if (where.OR.length === 0) return { items: [], page, pageSize: PAGE_SIZE, total: 0 };
  }
  const [rows, total] = await db.$transaction([
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.order.count({ where }),
  ]);
  return { items: rows.map(toSummary), page, pageSize: PAGE_SIZE, total };
}

export async function getOrderByCode(code: string): Promise<OrderDetail | null> {
  const number = parseOrderCode(code);
  if (number === null) return null;
  const order = await db.order.findUnique({ where: { number }, include: detailInclude });
  return order ? toDetail(order) : null;
}

export type UpdateOrderResult =
  | { ok: true; order: OrderDetail }
  | { ok: false; reason: "NOT_FOUND" | "INVALID_TRANSITION"; from?: OrderStatus };

export async function updateOrder(
  code: string,
  changes: { status?: OrderStatus; internalNote?: string },
): Promise<UpdateOrderResult> {
  const number = parseOrderCode(code);
  if (number === null) return { ok: false, reason: "NOT_FOUND" };

  return db.$transaction(async (tx) => {
    const current = await tx.order.findUnique({ where: { number }, select: { status: true } });
    if (!current) return { ok: false, reason: "NOT_FOUND" } as const;
    if (changes.status !== undefined && !canTransition(current.status, changes.status)) {
      return { ok: false, reason: "INVALID_TRANSITION", from: current.status } as const;
    }
    // The status condition makes a concurrent change of the same order fail instead of skipping a rule.
    const updated = await tx.order.updateMany({
      where: { number, status: current.status },
      data: {
        ...(changes.status !== undefined ? { status: changes.status } : {}),
        ...(changes.internalNote !== undefined ? { internalNote: changes.internalNote || null } : {}),
      },
    });
    if (updated.count === 0) return { ok: false, reason: "INVALID_TRANSITION", from: current.status } as const;
    const order = await tx.order.findUniqueOrThrow({ where: { number }, include: detailInclude });
    return { ok: true, order: toDetail(order) } as const;
  });
}
