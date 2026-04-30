import { describe, expect, it } from "vitest";

import { normalizeBankDetails } from "@/lib/normalize-bank";

describe("normalizeBankDetails", () => {
  it("strips whitespace, dashes, and dots", () => {
    expect(normalizeBankDetails(" 012-345.678 ")).toBe("012345678");
  });

  it("collapses internal whitespace runs", () => {
    expect(normalizeBankDetails("12  34  56")).toBe("123456");
  });

  it("removes non-alphanumeric separators between digits", () => {
    expect(normalizeBankDetails("12/34/56")).toBe("123456");
  });
});
