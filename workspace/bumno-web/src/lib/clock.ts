/**
 * Current time for business rules (opening hours, delivery slots, "today").
 * `BUMNO_FAKE_NOW` (ISO string) pins the clock for E2E tests; it is ignored in production.
 */
export function now(): Date {
  const fake = process.env.BUMNO_FAKE_NOW;
  if (fake && process.env.NODE_ENV !== "production") {
    const date = new Date(fake);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return new Date();
}
