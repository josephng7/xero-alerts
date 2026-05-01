import { describe, expect, it } from "vitest";

import { diffBankAccountSnapshots } from "@/lib/alerts/diff-accounts";

describe("diffBankAccountSnapshots", () => {
  it("detects added, removed, and changed account ids", () => {
    const previous = [
      {
        accountId: "a1",
        code: "001",
        name: "Main",
        type: "BANK",
        status: "ACTIVE",
        bankAccountNumber: "12-3456-0001111-00",
        currencyCode: "NZD",
        updatedDateUtc: null
      },
      {
        accountId: "a2",
        code: "002",
        name: "Secondary",
        type: "BANK",
        status: "ACTIVE",
        bankAccountNumber: "12-3456-0002222-00",
        currencyCode: "NZD",
        updatedDateUtc: null
      }
    ];

    const current = [
      {
        accountId: "a1",
        code: "001",
        name: "Main Updated",
        type: "BANK",
        status: "ACTIVE",
        bankAccountNumber: "12 3456 0001111 00",
        currencyCode: "NZD",
        updatedDateUtc: null
      },
      {
        accountId: "a3",
        code: "003",
        name: "New Account",
        type: "BANK",
        status: "ACTIVE",
        bankAccountNumber: "12-3456-0003333-00",
        currencyCode: "NZD",
        updatedDateUtc: null
      }
    ];

    const result = diffBankAccountSnapshots({ previous, current });
    expect(result.added).toEqual(["a3"]);
    expect(result.removed).toEqual(["a2"]);
    expect(result.changed).toEqual(["a1"]);
    expect(result.summary).toMatchObject({
      previousCount: 2,
      currentCount: 2,
      addedCount: 1,
      removedCount: 1,
      changedCount: 1
    });
  });
});
