import { describe, expect, it } from "vitest";

import { deriveEventStatus, extractAccountCount } from "@/lib/ui/baseline";

describe("ui baseline helpers", () => {
  it("extracts account count from snapshot payload", () => {
    expect(extractAccountCount({ accounts: [{}, {}, {}] })).toBe(3);
    expect(extractAccountCount({ accounts: "invalid" })).toBe(0);
    expect(extractAccountCount(null)).toBe(0);
  });

  it("derives event status from category or payload", () => {
    expect(deriveEventStatus({}, "CONTACT")).toBe("received");
    expect(deriveEventStatus({ events: [{}] }, null)).toBe("received");
    expect(deriveEventStatus({ events: [] }, null)).toBe("untyped");
    expect(deriveEventStatus({}, null)).toBe("untyped");
  });
});
