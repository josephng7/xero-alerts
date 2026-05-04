import { describe, expect, it } from "vitest";

import { deriveEventStatus, extractSnapshotLineCount } from "@/lib/ui/baseline";

describe("ui baseline helpers", () => {
  it("extracts line count from snapshot payload (contact bank or legacy accounts)", () => {
    expect(extractSnapshotLineCount({ contactBankLines: [{}, {}, {}] })).toBe(3);
    expect(extractSnapshotLineCount({ accounts: [{}, {}] })).toBe(2);
    expect(extractSnapshotLineCount({ contactBankLines: [], accounts: [{}, {}] })).toBe(0);
    expect(extractSnapshotLineCount({ accounts: "invalid" })).toBe(0);
    expect(extractSnapshotLineCount(null)).toBe(0);
  });

  it("derives event status from category or payload", () => {
    expect(deriveEventStatus({}, "CONTACT")).toBe("received");
    expect(deriveEventStatus({ events: [{}] }, null)).toBe("received");
    expect(deriveEventStatus({ events: [] }, null)).toBe("untyped");
    expect(deriveEventStatus({}, null)).toBe("untyped");
  });
});
