export const ORDER_STATUSES = ["NEW", "CONFIRMED", "DELIVERING", "COMPLETED", "CANCELLED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderLine = {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
};

export type OrderSummary = {
  code: string;
  createdAt: string;
  customerName: string;
  phone: string;
  deliverySlot: string;
  total: number;
  status: OrderStatus;
};

export type OrderDetail = OrderSummary & {
  address: string;
  note: string | null;
  internalNote: string | null;
  items: OrderLine[];
  updatedAt: string;
};

export type OrderListResponse = {
  items: OrderSummary[];
  page: number;
  pageSize: number;
  total: number;
};

export type CreateOrderResponse = {
  code: string;
  total: number;
  deliverySlot: string;
  items: { name: string; unitPrice: number; quantity: number }[];
};

export type ApiErrorCode =
  | "VALIDATION"
  | "SLOT_UNAVAILABLE"
  | "RATE_LIMITED"
  | "INVALID_PASSWORD"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "INVALID_TRANSITION"
  | "INTERNAL";

export type ApiErrorBody = {
  error: {
    code: ApiErrorCode;
    message: string;
    fields?: Record<string, string>;
  };
};
