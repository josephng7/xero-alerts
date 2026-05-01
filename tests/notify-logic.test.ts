import { describe, expect, it } from "vitest";

import { formatTeamsMessage } from "@/lib/notifications/formatting";
import { isActionableDiff } from "@/lib/notifications/logic";

describe("notify logic", () => {
  it("treats zero-change summaries as non-actionable", () => {
    expect(
      isActionableDiff({
        previousCount: 2,
        currentCount: 2,
        addedCount: 0,
        removedCount: 0,
        changedCount: 0
      })
    ).toBe(false);
  });

  it("formats concise Teams message", () => {
    const text = formatTeamsMessage({
      tenantId: "tenant-123",
      idempotencyKey: "evt_abc",
      diff: {
        added: ["a1"],
        removed: [],
        changed: ["a2"],
        summary: {
          previousCount: 2,
          currentCount: 3,
          addedCount: 1,
          removedCount: 0,
          changedCount: 1
        }
      }
    });

    expect(text).toContain("tenant tenant-123");
    expect(text).toContain("Added: 1");
    expect(text).toContain("Removed: 0");
    expect(text).toContain("Changed: 1");
    expect(text).toContain("Event key: evt_abc");
  });
});
