import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  it("limits each key within its window and resets after it", () => {
    const limiter = createRateLimiter({ limit: 5, windowMs: 600_000 });
    for (let i = 0; i < 5; i++) {
      expect(limiter.isLimited("1.1.1.1", 1000 + i)).toBe(false);
      limiter.hit("1.1.1.1", 1000 + i);
    }
    expect(limiter.isLimited("1.1.1.1", 2000)).toBe(true);
    expect(limiter.isLimited("2.2.2.2", 2000)).toBe(false);
    expect(limiter.isLimited("1.1.1.1", 1000 + 600_000)).toBe(false);
  });

  it("can be reset", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    limiter.hit("k", 0);
    expect(limiter.isLimited("k", 1)).toBe(true);
    limiter.reset();
    expect(limiter.isLimited("k", 1)).toBe(false);
  });
});
