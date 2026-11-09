import { shop } from "@/config/shop";

const MINUTE_MS = 60_000;
const offsetMs = shop.utcOffsetMinutes * MINUTE_MS;

type ShopHours = Pick<typeof shop, "openMinute" | "closeMinute" | "slotStepMinutes" | "minLeadMinutes">;

/** Midnight (shop time zone) of the day containing `at`, as a UTC timestamp. */
function shopMidnight(at: Date): number {
  const local = at.getTime() + offsetMs;
  return local - (((local % 86_400_000) + 86_400_000) % 86_400_000) - offsetMs;
}

/** Minute of the day in the shop time zone. */
export function shopMinuteOfDay(at: Date): number {
  return Math.floor((at.getTime() - shopMidnight(at)) / MINUTE_MS);
}

/** `YYYY-MM-DD` of `at` in the shop time zone. */
export function shopDateString(at: Date): string {
  return new Date(at.getTime() + offsetMs).toISOString().slice(0, 10);
}

/** UTC range [start, end) covering a `YYYY-MM-DD` day in the shop time zone, or null if invalid. */
export function shopDayRange(date: string): { start: Date; end: Date } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const midnightUtc = Date.parse(`${date}T00:00:00Z`);
  if (Number.isNaN(midnightUtc) || new Date(midnightUtc).toISOString().slice(0, 10) !== date) return null;
  const start = midnightUtc - offsetMs;
  return { start: new Date(start), end: new Date(start + 86_400_000) };
}

export function isWithinOpeningHours(at: Date, hours: ShopHours = shop): boolean {
  const minute = shopMinuteOfDay(at);
  return minute >= hours.openMinute && minute < hours.closeMinute;
}

/**
 * Delivery slots still bookable today: every `slotStepMinutes` from opening to closing (inclusive),
 * at least `minLeadMinutes` after `at`. Empty outside opening hours.
 */
export function availableSlots(at: Date, hours: ShopHours = shop): Date[] {
  if (!isWithinOpeningHours(at, hours)) return [];
  const midnight = shopMidnight(at);
  const earliest = at.getTime() + hours.minLeadMinutes * MINUTE_MS;
  const slots: Date[] = [];
  for (let minute = hours.openMinute; minute <= hours.closeMinute; minute += hours.slotStepMinutes) {
    const slot = midnight + minute * MINUTE_MS;
    if (slot >= earliest) slots.push(new Date(slot));
  }
  return slots;
}

/** The shop takes orders while it is open and at least one slot is left. */
export function isAcceptingOrders(at: Date, hours: ShopHours = shop): boolean {
  return availableSlots(at, hours).length > 0;
}

export function isSlotAvailable(slot: Date, at: Date, hours: ShopHours = shop): boolean {
  return availableSlots(at, hours).some((s) => s.getTime() === slot.getTime());
}

/** `7:30` style label of a slot in the shop time zone. */
export function formatSlot(slot: Date | string): string {
  const date = typeof slot === "string" ? new Date(slot) : slot;
  const minute = shopMinuteOfDay(date);
  return `${Math.floor(minute / 60)}:${String(minute % 60).padStart(2, "0")}`;
}
