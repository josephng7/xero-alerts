import { describe, expect, it } from "vitest";

import { maskBankValue } from "@/lib/masking";

describe("maskBankValue", () => {
  it("returns full value when length is <= 4", () => {
    expect(maskBankValue("1234")).toBe("1234");
  });

  it("masks all but last 4 digits", () => {
    expect(maskBankValue("1234567890")).toBe("******7890");
  });

  it("normalizes whitespace before masking", () => {
    expect(maskBankValue(" 12 34 56 ")).toBe("**3456");
  });
});
