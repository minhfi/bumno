import { describe, expect, it } from "vitest";
import { reportQuerySchema } from "./schema";

describe("reportQuerySchema", () => {
  it("accepts the four ranges and defaults to today", () => {
    for (const range of ["today", "7d", "30d", "365d"]) {
      expect(reportQuerySchema.parse({ range }).range).toBe(range);
    }
    expect(reportQuerySchema.parse({}).range).toBe("today");
  });

  it("rejects anything else", () => {
    for (const range of ["", "1d", "TODAY", "90d"]) {
      expect(reportQuerySchema.safeParse({ range }).success).toBe(false);
    }
  });
});
