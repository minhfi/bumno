import { describe, expect, it } from "vitest";
import { formatOrderCode, parseOrderCode } from "./code";

describe("order code", () => {
  it("formats and parses BN codes", () => {
    expect(formatOrderCode(1042)).toBe("BN-1042");
    expect(parseOrderCode("BN-1042")).toBe(1042);
    expect(parseOrderCode(" bn-1042 ")).toBe(1042);
    expect(parseOrderCode("BN1042")).toBe(1042);
  });

  it("returns null for anything else", () => {
    for (const input of ["", "1042", "BN-", "BN-0", "BN-12a", "XX-1042", "BN-1234567890"]) {
      expect(parseOrderCode(input), input).toBeNull();
    }
  });
});
