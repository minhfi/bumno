import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { formatOrderCode, parseOrderCode } from "./code";
import { priceOrder, repriceOrder } from "./pricing";
import type { CreateOrderData, UpdateOrderData } from "./schema";
import { canChangeShippingFee, canEdit, canTransition } from "./status";
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
    shippingFee: order.shippingFee,
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
      // `number` breaks ties (orders placed in the same instant), so pages are stable and never overlap.
      orderBy: [{ createdAt: "desc" }, { number: "desc" }],
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
  | { ok: false; reason: "NOT_FOUND" | "INVALID_TRANSITION" | "NOT_EDITABLE"; from?: OrderStatus }
  | { ok: false; reason: "UNKNOWN_PRODUCT" };

export async function updateOrder(code: string, changes: UpdateOrderData): Promise<UpdateOrderResult> {
  const number = parseOrderCode(code);
  if (number === null) return { ok: false, reason: "NOT_FOUND" };

  return db.$transaction(async (tx) => {
    const current = await tx.order.findUnique({ where: { number }, include: detailInclude });
    if (!current) return { ok: false, reason: "NOT_FOUND" } as const;
    const editing = changes.address !== undefined || changes.items !== undefined;
    if (changes.status !== undefined && !canTransition(current.status, changes.status)) {
      return { ok: false, reason: "INVALID_TRANSITION", from: current.status } as const;
    }
    if (editing && !canEdit(current.status)) return { ok: false, reason: "NOT_EDITABLE", from: current.status } as const;
    // Checked against the status before this change, so a fee can be saved together with completing the order.
    const changingFee = changes.shippingFee !== undefined && changes.shippingFee !== current.shippingFee;
    if (changingFee && !canChangeShippingFee(current.status)) {
      return { ok: false, reason: "NOT_EDITABLE", from: current.status } as const;
    }

    const repriced = changes.items ? repriceOrder(current.items, changes.items) : null;
    if (repriced && !repriced.ok) return { ok: false, reason: "UNKNOWN_PRODUCT" } as const;

    // `total` is always items + shipping fee; recompute it when either part changes.
    const shippingFee = changes.shippingFee ?? current.shippingFee;
    const itemsTotal = repriced ? repriced.total : current.total - current.shippingFee;
    const total = repriced || changingFee ? itemsTotal + shippingFee : undefined;

    // The status condition makes a concurrent change of the same order fail instead of skipping a rule.
    const updated = await tx.order.updateMany({
      where: { number, status: current.status },
      data: {
        ...(changes.status !== undefined ? { status: changes.status } : {}),
        ...(changes.internalNote !== undefined ? { internalNote: changes.internalNote || null } : {}),
        ...(changes.address !== undefined ? { address: changes.address } : {}),
        ...(changingFee ? { shippingFee } : {}),
        ...(total !== undefined ? { total } : {}),
      },
    });
    if (updated.count === 0) {
      // Lost a race with another change: report the status the order has now, not the one read before.
      const latest = await tx.order.findUnique({ where: { number }, select: { status: true } });
      const from = latest?.status ?? current.status;
      const notEditable = editing || (changingFee && !canChangeShippingFee(from));
      return { ok: false, reason: notEditable ? "NOT_EDITABLE" : "INVALID_TRANSITION", from } as const;
    }
    if (repriced) {
      await tx.orderItem.deleteMany({ where: { orderId: current.id } });
      await tx.orderItem.createMany({ data: repriced.lines.map((line) => ({ ...line, orderId: current.id })) });
    }
    const order = await tx.order.findUniqueOrThrow({ where: { number }, include: detailInclude });
    return { ok: true, order: toDetail(order) } as const;
  });
}
