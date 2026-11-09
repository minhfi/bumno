/**
 * Fixed-window counter kept in memory. Only correct for a single server instance
 * (see the plan's Risks section).
 */
export type RateLimiter = {
  /** True when `key` has already used up its quota in the current window. */
  isLimited(key: string, nowMs?: number): boolean;
  /** Counts one hit for `key`. */
  hit(key: string, nowMs?: number): void;
  reset(): void;
};

export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }): RateLimiter {
  const windows = new Map<string, { start: number; count: number }>();

  function current(key: string, nowMs: number) {
    const entry = windows.get(key);
    if (!entry || nowMs - entry.start >= windowMs) return undefined;
    return entry;
  }

  return {
    isLimited(key, nowMs = Date.now()) {
      return (current(key, nowMs)?.count ?? 0) >= limit;
    },
    hit(key, nowMs = Date.now()) {
      const entry = current(key, nowMs);
      if (entry) entry.count += 1;
      else windows.set(key, { start: nowMs, count: 1 });
      if (windows.size > 10_000) {
        for (const [k, v] of windows) if (nowMs - v.start >= windowMs) windows.delete(k);
      }
    },
    reset() {
      windows.clear();
    },
  };
}

/** ≤ 5 orders / 10 minutes / IP. */
export const orderRateLimiter = createRateLimiter({ limit: 5, windowMs: 10 * 60_000 });
/** ≤ 5 failed logins / 15 minutes / IP. */
export const loginRateLimiter = createRateLimiter({ limit: 5, windowMs: 15 * 60_000 });
