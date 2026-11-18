import { describe, expect, it } from "vitest";
import { canCancel, canChangeShippingFee, canEdit, canTransition, laterStatuses, nextStatus } from "./status";
import { ORDER_STATUSES, type OrderStatus } from "./types";

describe("status transitions", () => {
  it("moves forward one step at a time", () => {
    expect(nextStatus("NEW")).toBe("CONFIRMED");
    expect(nextStatus("CONFIRMED")).toBe("DELIVERING");
    expect(nextStatus("DELIVERING")).toBe("COMPLETED");
    expect(nextStatus("COMPLETED")).toBeNull();
    expect(nextStatus("CANCELLED")).toBeNull();
  });

  it("lists every later step, in order", () => {
    expect(laterStatuses("NEW")).toEqual(["CONFIRMED", "DELIVERING", "COMPLETED"]);
    expect(laterStatuses("DELIVERING")).toEqual(["COMPLETED"]);
    expect(laterStatuses("COMPLETED")).toEqual([]);
    expect(laterStatuses("CANCELLED")).toEqual([]);
  });

  it("allows moving forward any number of steps, or cancelling before completion; never back", () => {
    const allowed = new Set([
      "NEW>CONFIRMED", "NEW>DELIVERING", "NEW>COMPLETED", "CONFIRMED>DELIVERING", "CONFIRMED>COMPLETED", "DELIVERING>COMPLETED",
      "NEW>CANCELLED", "CONFIRMED>CANCELLED", "DELIVERING>CANCELLED",
    ]);
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

  it("can edit the address and items only before delivery", () => {
    const editable: OrderStatus[] = ["NEW", "CONFIRMED"];
    for (const status of ORDER_STATUSES) expect(canEdit(status), status).toBe(editable.includes(status));
  });

  it("allows changing the shipping fee until the order is completed or cancelled", () => {
    const allowed = ORDER_STATUSES.filter(canChangeShippingFee);
    expect(allowed).toEqual(["NEW", "CONFIRMED", "DELIVERING"]);
  });
});
