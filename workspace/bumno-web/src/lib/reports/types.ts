export const REPORT_RANGES = ["today", "7d", "30d", "365d"] as const;
export type ReportRange = (typeof REPORT_RANGES)[number];
export type ReportBucket = "hour" | "day" | "month";

export type ReportSummary = {
  /** Sum of `total` of COMPLETED orders (items + shipping fees), VND. */
  revenue: number;
  /** Sum of `shippingFee` of COMPLETED orders, VND; part of `revenue`. */
  shippingTotal: number;
  completedOrders: number;
  /** revenue / completedOrders, rounded; 0 when there are no completed orders. */
  averageOrderValue: number;
  cancelledOrders: number;
  /** Cancelled / all orders in the range, 0..1; 0 when there are no orders. */
  cancelRate: number;
};

export type ReportSeriesPoint = { start: string; revenue: number; completedOrders: number };

export type ReportItem = {
  productId: string;
  name: string;
  addon: boolean;
  quantity: number;
  revenue: number;
  /** Item revenue only (no shipping fee). Share of `current.revenue`, 0..1. */
  share: number;
};

export type ReportResponse = {
  range: ReportRange;
  bucket: ReportBucket;
  /** ISO, inclusive: shop-time midnight of the first day. */
  from: string;
  /** ISO, exclusive: shop-time midnight after today. */
  to: string;
  current: ReportSummary;
  /** Same length, immediately before `from`. */
  previous: ReportSummary;
  /** NEW + CONFIRMED + DELIVERING in the current range. */
  pending: { orders: number; total: number };
  /** Every bucket in order, zeros included. */
  series: ReportSeriesPoint[];
  /** COMPLETED orders only, sorted by revenue. */
  items: ReportItem[];
};
