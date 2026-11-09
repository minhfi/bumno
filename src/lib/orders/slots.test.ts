import { describe, expect, it } from "vitest";
import {
  availableSlots,
  formatSlot,
  isAcceptingOrders,
  isSlotAvailable,
  shopDateString,
  shopDayRange,
} from "./slots";

/** A time in Asia/Ho_Chi_Minh. */
const vn = (local: string) => new Date(`${local}:00+07:00`);

describe("availableSlots", () => {
  it("is empty before opening and after closing", () => {
    expect(availableSlots(vn("2026-11-09T05:59"))).toEqual([]);
    expect(availableSlots(vn("2026-11-09T11:00"))).toEqual([]);
    expect(availableSlots(vn("2026-11-09T23:30"))).toEqual([]);
    expect(isAcceptingOrders(vn("2026-11-09T05:30"))).toBe(false);
  });

  it("offers 30-minute slots at least 30 minutes ahead, up to closing", () => {
    const slots = availableSlots(vn("2026-11-09T06:00")).map(formatSlot);
    expect(slots).toEqual(["6:30", "7:00", "7:30", "8:00", "8:30", "9:00", "9:30", "10:00", "10:30", "11:00"]);
    expect(availableSlots(vn("2026-11-09T07:01")).map(formatSlot)[0]).toBe("8:00");
    expect(availableSlots(vn("2026-11-09T07:00")).map(formatSlot)[0]).toBe("7:30");
  });

  it("stops accepting orders when no slot is left near closing", () => {
    expect(availableSlots(vn("2026-11-09T10:30")).map(formatSlot)).toEqual(["11:00"]);
    expect(isAcceptingOrders(vn("2026-11-09T10:30"))).toBe(true);
    expect(availableSlots(vn("2026-11-09T10:31"))).toEqual([]);
    expect(isAcceptingOrders(vn("2026-11-09T10:45"))).toBe(false);
  });

  it("checks a requested slot", () => {
    const at = vn("2026-11-09T07:10");
    expect(isSlotAvailable(vn("2026-11-09T08:00"), at)).toBe(true);
    expect(isSlotAvailable(vn("2026-11-09T07:30"), at)).toBe(false); // < 30 minutes ahead
    expect(isSlotAvailable(vn("2026-11-09T08:15"), at)).toBe(false); // not on the grid
    expect(isSlotAvailable(vn("2026-11-10T08:00"), at)).toBe(false); // another day
    expect(isSlotAvailable(vn("2026-11-09T11:30"), at)).toBe(false); // after closing
  });
});

describe("shop day helpers", () => {
  it("uses the Vietnam calendar day", () => {
    expect(shopDateString(new Date("2026-11-08T17:30:00Z"))).toBe("2026-11-09");
    expect(shopDateString(new Date("2026-11-08T16:59:00Z"))).toBe("2026-11-08");
    const range = shopDayRange("2026-11-09");
    expect(range?.start.toISOString()).toBe("2026-11-08T17:00:00.000Z");
    expect(range?.end.toISOString()).toBe("2026-11-09T17:00:00.000Z");
    expect(shopDayRange("2026-02-30")).toBeNull();
    expect(shopDayRange("hôm nay")).toBeNull();
  });
});
