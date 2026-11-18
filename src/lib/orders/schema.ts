import { z } from "zod";
import { formatVnd, productIds } from "@/config/menu";
import { ORDER_STATUSES } from "./types";

export const MAX_QUANTITY = 20;
export const MAX_ADDRESS_LENGTH = 300;
export const MAX_SHIPPING_FEE = 1_000_000;
/** Most distinct lines an edited order can carry (menu items plus legacy lines). */
const MAX_ORDER_LINES = 20;

/** Removes spaces, dots and dashes people type into phone numbers. */
export function normalizePhone(value: string): string {
  return value.replace(/[\s.-]/g, "");
}

export const orderItemSchema = z.object({
  productId: z.enum(productIds, { error: "Món không có trong menu" }),
  quantity: z
    .number({ error: "Số lượng không hợp lệ" })
    .int("Số lượng không hợp lệ")
    .min(0, "Số lượng không hợp lệ")
    .max(MAX_QUANTITY, `Mỗi món tối đa ${MAX_QUANTITY} phần`),
});

const addressSchema = z
  .string({ error: "Vui lòng nhập địa chỉ" })
  .trim()
  .min(5, "Vui lòng nhập địa chỉ giao hàng")
  .max(MAX_ADDRESS_LENGTH, `Địa chỉ tối đa ${MAX_ADDRESS_LENGTH} ký tự`);

const hasItemsToOrder = (items: { quantity: number }[]) => items.some((item) => item.quantity > 0);
const hasUniqueProducts = (items: { productId: string }[]) =>
  new Set(items.map((item) => item.productId)).size === items.length;

export const createOrderSchema = z.object({
  customerName: z
    .string({ error: "Vui lòng nhập họ tên" })
    .trim()
    .min(2, "Vui lòng nhập họ tên")
    .max(80, "Họ tên tối đa 80 ký tự"),
  phone: z
    .string({ error: "Vui lòng nhập số điện thoại" })
    .transform(normalizePhone)
    .pipe(z.string().regex(/^0\d{9}$/, "Số điện thoại gồm 10 số, bắt đầu bằng 0")),
  address: addressSchema,
  deliverySlot: z.iso.datetime({ offset: true, error: "Vui lòng chọn giờ nhận" }),
  note: z
    .string()
    .trim()
    .max(500, "Ghi chú tối đa 500 ký tự")
    .optional()
    .transform((value) => (value ? value : undefined)),
  items: z
    .array(orderItemSchema, { error: "Chọn ít nhất 1 món" })
    .max(productIds.length)
    .refine(hasItemsToOrder, "Chọn ít nhất 1 món")
    .refine(hasUniqueProducts, "Mỗi món chỉ chọn một lần"),
  /** Honeypot: hidden from people, bots fill it in. */
  website: z.string().max(0, "Yêu cầu không hợp lệ").optional(),
});

export type CreateOrderInput = z.input<typeof createOrderSchema>;
export type CreateOrderData = z.output<typeof createOrderSchema>;

export const loginSchema = z.object({
  username: z.string({ error: "Vui lòng nhập tên đăng nhập" }).trim().min(1, "Vui lòng nhập tên đăng nhập").max(100),
  password: z.string({ error: "Vui lòng nhập mật khẩu" }).min(1, "Vui lòng nhập mật khẩu").max(200),
});

export const orderStatusSchema = z.enum(ORDER_STATUSES, { error: "Trạng thái không hợp lệ" });

export const listOrdersQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ")
    .optional(),
  status: orderStatusSchema.optional(),
  q: z.string().trim().max(50).optional(),
  page: z.coerce.number({ error: "Trang không hợp lệ" }).int("Trang không hợp lệ").min(1, "Trang không hợp lệ").default(1),
});

/** An edited line may use a product that is no longer on the menu but is already in the order, so the id is checked in the service. */
const editItemSchema = z.object({
  productId: z.string({ error: "Món không hợp lệ" }).min(1, "Món không hợp lệ").max(64, "Món không hợp lệ"),
  quantity: orderItemSchema.shape.quantity,
});

export const updateOrderSchema = z
  .object({
    status: orderStatusSchema.optional(),
    internalNote: z.string().trim().max(1000, "Ghi chú tối đa 1000 ký tự").optional(),
    shippingFee: z
      .number({ error: "Phí ship không hợp lệ" })
      .int("Phí ship không hợp lệ")
      .min(0, "Phí ship không hợp lệ")
      .max(MAX_SHIPPING_FEE, `Phí ship tối đa ${formatVnd(MAX_SHIPPING_FEE)}`)
      .optional(),
    address: addressSchema.optional(),
    items: z
      .array(editItemSchema, { error: "Chọn ít nhất 1 món" })
      .max(MAX_ORDER_LINES, "Quá nhiều món")
      .refine(hasItemsToOrder, "Chọn ít nhất 1 món")
      .refine(hasUniqueProducts, "Mỗi món chỉ chọn một lần")
      .optional(),
  })
  .refine(
    (body) =>
      body.status !== undefined ||
      body.internalNote !== undefined ||
      body.shippingFee !== undefined ||
      body.address !== undefined ||
      body.items !== undefined,
    "Cần ít nhất 1 trường để cập nhật",
  )
  .refine(
    (body) => body.status === undefined || (body.address === undefined && body.items === undefined),
    { message: "Không đổi trạng thái cùng lúc với địa chỉ hoặc món", path: ["status"] },
  )
  .refine(
    (body) => body.shippingFee === undefined || (body.address === undefined && body.items === undefined),
    { message: "Không đổi phí ship cùng lúc với địa chỉ hoặc món", path: ["shippingFee"] },
  );

export type UpdateOrderData = z.output<typeof updateOrderSchema>;

/** First error message per top-level field, for the `fields` part of a VALIDATION error. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? String(issue.path[0]) : "form";
    if (!(key in fields)) fields[key] = issue.message;
  }
  return fields;
}
