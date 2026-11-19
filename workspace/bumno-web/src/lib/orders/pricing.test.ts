import { describe, expect, it } from "vitest";
import { priceOrder, repriceOrder } from "./pricing";

describe("priceOrder", () => {
  it("prices from the menu config and snapshots name and unit price", () => {
    const { lines, total } = priceOrder([
      { productId: "phan-thuong", quantity: 2 },
      { productId: "them-banh", quantity: 1 },
      { productId: "them-long", quantity: 0 },
    ]);
    expect(lines).toEqual([
      { productId: "phan-thuong", name: "Phần thường", unitPrice: 30_000, quantity: 2 },
      { productId: "them-banh", name: "Bánh thêm", unitPrice: 5_000, quantity: 1 },
    ]);
    expect(total).toBe(65_000);
  });

  it("ignores any price sent by the client", () => {
    const tampered = [{ productId: "phan-dac-biet", quantity: 1, unitPrice: 1, price: 1 }];
    expect(priceOrder(tampered).total).toBe(40_000);
  });

  it("throws for products not on the menu", () => {
    expect(() => priceOrder([{ productId: "pho-bo", quantity: 1 }])).toThrow();
  });
});

describe("repriceOrder", () => {
  const existing = [
    { productId: "phan-thuong", name: "Phần thường", unitPrice: 25_000, quantity: 1 },
    { productId: "mon-cu", name: "Món cũ", unitPrice: 20_000, quantity: 1 },
  ];

  it("keeps the stored price of lines already in the order and prices new lines from the menu", () => {
    const result = repriceOrder(existing, [
      { productId: "phan-thuong", quantity: 2 },
      { productId: "them-banh", quantity: 1 },
    ]);
    expect(result).toEqual({
      ok: true,
      lines: [
        { productId: "phan-thuong", name: "Phần thường", unitPrice: 25_000, quantity: 2 },
        { productId: "them-banh", name: "Bánh thêm", unitPrice: 5_000, quantity: 1 },
      ],
      total: 55_000,
    });
  });

  it("drops lines set to 0 and keeps a product that left the menu while it is in the order", () => {
    const result = repriceOrder(existing, [
      { productId: "phan-thuong", quantity: 0 },
      { productId: "mon-cu", quantity: 3 },
    ]);
    expect(result).toEqual({
      ok: true,
      lines: [{ productId: "mon-cu", name: "Món cũ", unitPrice: 20_000, quantity: 3 }],
      total: 60_000,
    });
  });

  it("reports a product that is neither in the order nor on the menu", () => {
    expect(repriceOrder(existing, [{ productId: "pho-bo", quantity: 1 }])).toEqual({ ok: false, unknownProductId: "pho-bo" });
  });
});
