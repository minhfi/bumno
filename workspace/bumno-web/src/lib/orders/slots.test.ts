import { describe, expect, it } from "vitest";
import {
  availableSlots,
  formatSlot,
  isSlotAvailable,
  shopDateString,
  shopDayRange,
  slotDayLabel,
} from "./slots";

/** A time in Asia/Ho_Chi_Minh. */
const vn = (local: string) => new Date(`${local}:00+07:00`);

describe("availableSlots", () => {
  it("offers half-hour slots from 6:00 to 19:30, at least 30 minutes ahead", () => {
    const slots = availableSlots(vn("2026-11-09T06:00")).map(formatSlot);
    expect(slots.slice(0, 3)).toEqual(["6:30", "7:00", "7:30"]);
    expect(slots).toContain("19:30");
    expect(slots).not.toContain("20:00");
    expect(slots).not.toContain("5:30");
    expect(slots.at(-1)).toBe("19:30"); // tomorrow evening
    expect(slots.filter((s) => s === "6:00")).toHaveLength(1); // tomorrow morning only
    expect(availableSlots(vn("2026-11-09T07:01")).map(formatSlot)[0]).toBe("8:00");
    expect(availableSlots(vn("2026-11-09T07:00")).map(formatSlot)[0]).toBe("7:30");
  });

  it("skips the night: orders placed late roll over to 6:00 the next morning", () => {
    const slots = availableSlots(vn("2026-11-09T23:45"));
    expect(slots.map(formatSlot).slice(0, 2)).toEqual(["6:00", "6:30"]);
    expect(slots[0].toISOString()).toBe("2026-11-09T23:00:00.000Z");
    expect(availableSlots(vn("2026-11-09T19:45"))[0].toISOString()).toBe("2026-11-09T23:00:00.000Z");
  });

  it("checks a requested slot", () => {
    const at = vn("2026-11-09T07:10");
    expect(isSlotAvailable(vn("2026-11-09T08:00"), at)).toBe(true);
    expect(isSlotAvailable(vn("2026-11-09T07:30"), at)).toBe(false); // < 30 minutes ahead
    expect(isSlotAvailable(vn("2026-11-09T08:15"), at)).toBe(false); // not on the grid
    expect(isSlotAvailable(vn("2026-11-10T19:30"), at)).toBe(true); // tomorrow, last slot
    expect(isSlotAvailable(vn("2026-11-11T08:00"), at)).toBe(false); // the day after tomorrow
    expect(isSlotAvailable(vn("2026-11-09T20:00"), at)).toBe(false); // night, no delivery
    expect(isSlotAvailable(vn("2026-11-10T05:30"), at)).toBe(false); // night, no delivery
    expect(isSlotAvailable(vn("2026-11-10T06:00"), at)).toBe(true); // tomorrow morning
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

describe("slotDayLabel", () => {
  it("names the day of a slot relative to now", () => {
    const now = vn("2026-11-09T23:50");
    expect(slotDayLabel(vn("2026-11-09T06:00"), now)).toBe("hôm nay");
    expect(slotDayLabel(vn("2026-11-10T06:00"), now)).toBe("mai 10/11");
    expect(slotDayLabel(vn("2026-11-08T19:30").toISOString(), now)).toBe("hôm qua");
    expect(slotDayLabel(vn("2026-11-12T08:00"), now)).toBe("12/11");
  });
});
