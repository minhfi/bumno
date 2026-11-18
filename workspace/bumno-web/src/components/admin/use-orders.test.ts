import { describe, expect, it } from "vitest";
import type { OrderSummary } from "@/lib/orders/types";
import { mergePages } from "./use-orders";

const order = (code: string): OrderSummary => ({
  code,
  createdAt: "2026-11-17T00:00:00.000Z",
  customerName: "Khách",
  phone: "0901234567",
  deliverySlot: "2026-11-17T01:00:00.000Z",
  total: 35_000,
  status: "NEW",
});

describe("mergePages", () => {
  it("joins pages in order", () => {
    expect(mergePages([[order("BN-3"), order("BN-2")], [order("BN-1")]]).map((o) => o.code)).toEqual(["BN-3", "BN-2", "BN-1"]);
  });

  it("keeps an order once when a new order pushed it onto the next page", () => {
    const merged = mergePages([[order("BN-4"), order("BN-3")], [order("BN-3"), order("BN-2")]]);
    expect(merged.map((o) => o.code)).toEqual(["BN-4", "BN-3", "BN-2"]);
  });

  it("keeps the first copy, which comes from the fresher page", () => {
    const fresh = { ...order("BN-1"), status: "CONFIRMED" as const };
    expect(mergePages([[fresh], [order("BN-1")]])[0].status).toBe("CONFIRMED");
  });
});
