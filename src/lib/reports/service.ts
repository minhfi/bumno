import { findMenuItem } from "@/config/menu";
import { shop } from "@/config/shop";
import { db } from "@/lib/db";
import { bucketKey, bucketStarts, previousWindow, RANGE_BUCKET, reportWindow, type ReportWindow } from "./range";
import type { ReportItem, ReportRange, ReportResponse, ReportSummary } from "./types";

const PENDING_STATUSES = new Set(["NEW", "CONFIRMED", "DELIVERING"]);

type StatusTotals = Map<string, { orders: number; total: number }>;

async function statusTotals({ from, to }: ReportWindow): Promise<StatusTotals> {
  const rows = await db.order.groupBy({
    by: ["status"],
    where: { deliverySlot: { gte: from, lt: to } },
    _count: { _all: true },
    _sum: { total: true },
  });
  return new Map(rows.map((row) => [row.status, { orders: row._count._all, total: row._sum.total ?? 0 }]));
}

function summarize(totals: StatusTotals): ReportSummary {
  const completed = totals.get("COMPLETED") ?? { orders: 0, total: 0 };
  const cancelledOrders = totals.get("CANCELLED")?.orders ?? 0;
  const allOrders = [...totals.values()].reduce((sum, row) => sum + row.orders, 0);
  return {
    revenue: completed.total,
    completedOrders: completed.orders,
    averageOrderValue: completed.orders > 0 ? Math.round(completed.total / completed.orders) : 0,
    cancelledOrders,
    cancelRate: allOrders > 0 ? cancelledOrders / allOrders : 0,
  };
}

type SeriesRow = { bucket: number; revenue: number; orders: number };
type ItemRow = { productId: string; name: string; quantity: number; revenue: number };

/** Revenue report for a rolling range by delivery date, in the shop time zone. */
export async function getReport(range: ReportRange, at: Date): Promise<ReportResponse> {
  const window = reportWindow(range, at);
  const { from, to } = window;
  const bucket = RANGE_BUCKET[range];

  const [current, previous, seriesRows, itemRows] = await Promise.all([
    statusTotals(window),
    statusTotals(previousWindow(window)),
    db.$queryRaw<SeriesRow[]>`
      SELECT
        EXTRACT(EPOCH FROM date_trunc(${bucket}, (o."deliverySlot" AT TIME ZONE 'UTC') AT TIME ZONE ${shop.timeZone}))::float8 AS bucket,
        SUM(o."total")::float8 AS revenue,
        COUNT(*)::int AS orders
      FROM "Order" o
      WHERE o."status" = 'COMPLETED' AND o."deliverySlot" >= ${from} AND o."deliverySlot" < ${to}
      GROUP BY 1`,
    db.$queryRaw<ItemRow[]>`
      SELECT
        i."productId" AS "productId",
        (array_agg(i."name" ORDER BY o."deliverySlot" DESC, o."createdAt" DESC))[1] AS name,
        SUM(i."quantity")::float8 AS quantity,
        SUM(i."unitPrice" * i."quantity")::float8 AS revenue
      FROM "OrderItem" i
      JOIN "Order" o ON o."id" = i."orderId"
      WHERE o."status" = 'COMPLETED' AND o."deliverySlot" >= ${from} AND o."deliverySlot" < ${to}
      GROUP BY i."productId"
      ORDER BY revenue DESC, i."productId"`,
  ]);

  const summary = summarize(current);
  const byBucket = new Map(seriesRows.map((row) => [row.bucket, row]));
  const series = bucketStarts(bucket, window).map((start) => {
    const row = byBucket.get(bucketKey(bucket, start));
    return { start: start.toISOString(), revenue: row?.revenue ?? 0, completedOrders: row?.orders ?? 0 };
  });

  const items: ReportItem[] = itemRows.map((row) => ({
    productId: row.productId,
    name: row.name,
    addon: findMenuItem(row.productId)?.addon ?? false,
    quantity: row.quantity,
    revenue: row.revenue,
    share: summary.revenue > 0 ? row.revenue / summary.revenue : 0,
  }));

  const pending = [...current.entries()]
    .filter(([status]) => PENDING_STATUSES.has(status))
    .reduce((sum, [, row]) => ({ orders: sum.orders + row.orders, total: sum.total + row.total }), { orders: 0, total: 0 });

  return {
    range,
    bucket,
    from: from.toISOString(),
    to: to.toISOString(),
    current: summary,
    previous: summarize(previous),
    pending,
    series,
    items,
  };
}
