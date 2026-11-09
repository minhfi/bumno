import { describe, expect, it } from "vitest";
import { canCancel, canTransition, nextStatus } from "./status";
import { ORDER_STATUSES, type OrderStatus } from "./types";

describe("status transitions", () => {
  it("moves forward one step at a time", () => {
    expect(nextStatus("NEW")).toBe("CONFIRMED");
    expect(nextStatus("CONFIRMED")).toBe("DELIVERING");
    expect(nextStatus("DELIVERING")).toBe("COMPLETED");
    expect(nextStatus("COMPLETED")).toBeNull();
    expect(nextStatus("CANCELLED")).toBeNull();
  });

  it("only allows the listed transitions", () => {
    const allowed = new Set(["NEW>CONFIRMED", "CONFIRMED>DELIVERING", "DELIVERING>COMPLETED", "NEW>CANCELLED", "CONFIRMED>CANCELLED", "DELIVERING>CANCELLED"]);
    for (const from of ORDER_STATUSES) {
      for (const to of ORDER_STATUSES) {
        expect(canTransition(from, to), `${from} → ${to}`).toBe(allowed.has(`${from}>${to}`));
      }
    }
  });

  it("cannot cancel a final order", () => {
    const finals: OrderStatus[] = ["COMPLETED", "CANCELLED"];
    for (const status of finals) expect(canCancel(status)).toBe(false);
    expect(canCancel("DELIVERING")).toBe(true);
  });
});
