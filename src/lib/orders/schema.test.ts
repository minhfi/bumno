import { describe, expect, it } from "vitest";
import { createOrderSchema, fieldErrors, listOrdersQuerySchema, updateOrderSchema } from "./schema";

const valid = {
  customerName: "Nguyễn Lan",
  phone: "0901 234 567",
  address: "12 Lê Lợi, Quận 1",
  deliverySlot: "2026-11-09T07:30:00+07:00",
  note: "",
  items: [
    { productId: "phan-thuong", quantity: 2 },
    { productId: "them-long", quantity: 0 },
  ],
  website: "",
};

function errorsOf(input: unknown) {
  const result = createOrderSchema.safeParse(input);
  return result.success ? {} : fieldErrors(result.error);
}

describe("createOrderSchema", () => {
  it("accepts a valid order and normalizes the phone number", () => {
    const result = createOrderSchema.parse(valid);
    expect(result.phone).toBe("0901234567");
    expect(result.note).toBeUndefined();
  });

  it.each(["090123456", "09012345678", "1901234567", "09012a4567", ""])("rejects phone %j", (phone) => {
    expect(errorsOf({ ...valid, phone }).phone).toBe("Số điện thoại gồm 10 số, bắt đầu bằng 0");
  });

  it("rejects quantities outside 0–20", () => {
    expect(errorsOf({ ...valid, items: [{ productId: "phan-thuong", quantity: 21 }] }).items).toBe("Mỗi món tối đa 20 phần");
    expect(errorsOf({ ...valid, items: [{ productId: "phan-thuong", quantity: -1 }] }).items).toBeDefined();
    expect(errorsOf({ ...valid, items: [{ productId: "phan-thuong", quantity: 1.5 }] }).items).toBeDefined();
    expect(errorsOf({ ...valid, items: [{ productId: "phan-thuong", quantity: 20 }] }).items).toBeUndefined();
  });

  it("requires at least one item in total", () => {
    expect(errorsOf({ ...valid, items: [{ productId: "phan-thuong", quantity: 0 }] }).items).toBe("Chọn ít nhất 1 món");
    expect(errorsOf({ ...valid, items: [] }).items).toBe("Chọn ít nhất 1 món");
  });

  it("rejects unknown and duplicate products", () => {
    expect(errorsOf({ ...valid, items: [{ productId: "pho-bo", quantity: 1 }] }).items).toBe("Món không có trong menu");
    expect(
      errorsOf({ ...valid, items: [{ productId: "phan-thuong", quantity: 1 }, { productId: "phan-thuong", quantity: 1 }] }).items,
    ).toBe("Mỗi món chỉ chọn một lần");
  });

  it("rejects a filled honeypot", () => {
    expect(errorsOf({ ...valid, website: "http://spam.example" }).website).toBeDefined();
  });

  it("requires name, address and slot", () => {
    const errors = errorsOf({ ...valid, customerName: " ", address: "", deliverySlot: "7:30" });
    expect(errors.customerName).toBe("Vui lòng nhập họ tên");
    expect(errors.address).toBe("Vui lòng nhập địa chỉ giao hàng");
    expect(errors.deliverySlot).toBe("Vui lòng chọn giờ nhận");
  });
});

describe("listOrdersQuerySchema", () => {
  it("defaults page to 1 and rejects bad values", () => {
    expect(listOrdersQuerySchema.parse({}).page).toBe(1);
    expect(listOrdersQuerySchema.safeParse({ page: "0" }).success).toBe(false);
    expect(listOrdersQuerySchema.safeParse({ status: "PAID" }).success).toBe(false);
    expect(listOrdersQuerySchema.safeParse({ date: "09/11/2026" }).success).toBe(false);
  });
});

describe("updateOrderSchema", () => {
  it("needs at least one field", () => {
    expect(updateOrderSchema.safeParse({}).success).toBe(false);
    expect(updateOrderSchema.safeParse({ internalNote: "" }).success).toBe(true);
    expect(updateOrderSchema.safeParse({ status: "CONFIRMED" }).success).toBe(true);
  });

  it("accepts an address and items, with the same rules as a new order", () => {
    expect(updateOrderSchema.safeParse({ address: "  12 Lê Lợi, Quận 1 " }).data?.address).toBe("12 Lê Lợi, Quận 1");
    expect(updateOrderSchema.safeParse({ address: "abc" }).success).toBe(false);
    expect(updateOrderSchema.safeParse({ items: [{ productId: "phan-thuong", quantity: 2 }] }).success).toBe(true);
    expect(updateOrderSchema.safeParse({ items: [{ productId: "phan-thuong", quantity: 0 }] }).success).toBe(false);
    expect(updateOrderSchema.safeParse({ items: [] }).success).toBe(false);
    expect(updateOrderSchema.safeParse({ items: [{ productId: "phan-thuong", quantity: 21 }] }).success).toBe(false);
    expect(
      updateOrderSchema.safeParse({ items: [{ productId: "a", quantity: 1 }, { productId: "a", quantity: 1 }] }).success,
    ).toBe(false);
  });

  it("does not combine a status change with an address or items", () => {
    expect(updateOrderSchema.safeParse({ status: "CONFIRMED", address: "12 Lê Lợi, Quận 1" }).success).toBe(false);
    expect(updateOrderSchema.safeParse({ status: "CONFIRMED", items: [{ productId: "phan-thuong", quantity: 1 }] }).success).toBe(false);
    expect(updateOrderSchema.safeParse({ internalNote: "x", address: "12 Lê Lợi, Quận 1" }).success).toBe(true);
  });
});
