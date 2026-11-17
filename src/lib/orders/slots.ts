import { shop } from "@/config/shop";

const MINUTE_MS = 60_000;
const offsetMs = shop.utcOffsetMinutes * MINUTE_MS;

type ShopHours = Pick<typeof shop, "deliveryStartMinute" | "deliveryEndMinute" | "slotStepMinutes" | "minLeadMinutes">;

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

/**
 * Delivery slots bookable right now: every `slotStepMinutes` from the first grid point at least
 * `minLeadMinutes` after `at` until the end of tomorrow's delivery window, skipping the night (before `deliveryStartMinute`
 * or from `deliveryEndMinute`). The shop takes orders at any time; only delivery is limited to the day.
 */
export function availableSlots(at: Date, hours: ShopHours = shop): Date[] {
  const midnight = shopMidnight(at);
  const stepMs = hours.slotStepMinutes * MINUTE_MS;
  const earliest = at.getTime() + hours.minLeadMinutes * MINUTE_MS;
  const first = midnight + Math.ceil((earliest - midnight) / stepMs) * stepMs;
  const last = midnight + (24 * 60 + hours.deliveryEndMinute) * MINUTE_MS; // tomorrow, delivery window end (exclusive)
  const slots: Date[] = [];
  for (let t = first; t < last; t += stepMs) {
    const minute = shopMinuteOfDay(new Date(t));
    if (minute >= hours.deliveryStartMinute && minute < hours.deliveryEndMinute) slots.push(new Date(t));
  }
  return slots;
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

/** Which day a slot falls on, relative to `now`: `hôm nay`, `mai`, `hôm qua`, or `18/11`. */
export function slotDayLabel(slot: Date | string, now: Date): string {
  const date = shopDateString(typeof slot === "string" ? new Date(slot) : slot);
  const dayMs = 86_400_000;
  if (date === shopDateString(now)) return "hôm nay";
  if (date === shopDateString(new Date(now.getTime() + dayMs))) return "mai";
  if (date === shopDateString(new Date(now.getTime() - dayMs))) return "hôm qua";
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
}
