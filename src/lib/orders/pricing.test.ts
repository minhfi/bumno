import { describe, expect, it } from "vitest";
import { priceOrder } from "./pricing";

describe("priceOrder", () => {
  it("prices from the menu config and snapshots name and unit price", () => {
    const { lines, total } = priceOrder([
      { productId: "phan-thuong", quantity: 2 },
      { productId: "them-banh", quantity: 1 },
      { productId: "them-long", quantity: 0 },
    ]);
    expect(lines).toEqual([
      { productId: "phan-thuong", name: "Phần thường", unitPrice: 35_000, quantity: 2 },
      { productId: "them-banh", name: "Thêm bánh", unitPrice: 10_000, quantity: 1 },
    ]);
    expect(total).toBe(80_000);
  });

  it("ignores any price sent by the client", () => {
    const tampered = [{ productId: "phan-dac-biet", quantity: 1, unitPrice: 1, price: 1 }];
    expect(priceOrder(tampered).total).toBe(50_000);
  });

  it("throws for products not on the menu", () => {
    expect(() => priceOrder([{ productId: "pho-bo", quantity: 1 }])).toThrow();
  });
});
