import { z } from "zod";
import { REPORT_RANGES } from "./types";

export const reportQuerySchema = z.object({
  range: z.enum(REPORT_RANGES, { error: "Khoảng thời gian không hợp lệ" }).default("today"),
});
