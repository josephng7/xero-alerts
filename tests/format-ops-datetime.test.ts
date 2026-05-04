import { describe, expect, it } from "vitest";

import { formatOpsDateTime, OPS_DISPLAY_TIME_ZONE } from "@/lib/ui/format-ops-datetime";

describe("formatOpsDateTime", () => {
  it("uses Asia/Shanghai offset in the label", () => {
    expect(OPS_DISPLAY_TIME_ZONE).toBe("Asia/Shanghai");
  });

  it("formats UTC noon as Shanghai 20:00 same calendar day", () => {
    const s = formatOpsDateTime("2026-01-15T12:00:00.000Z");
    expect(s).toMatch(/^2026-01-15 20:00:00 [+−]?0?8:00 \(Asia\/Shanghai\)$/);
  });

  it("returns N/A for null", () => {
    expect(formatOpsDateTime(null)).toBe("N/A");
  });

  it("returns Invalid date for garbage input", () => {
    expect(formatOpsDateTime("not-a-date")).toBe("Invalid date");
  });
});
