import { describe, expect, it } from "vitest";

import { diffBankAccountSnapshots } from "@/lib/alerts/diff-accounts";

describe("diffBankAccountSnapshots (contact bank lines)", () => {
  it("detects added, removed, and changed line keys", () => {
    const previous = [
      {
        lineKey: "l1",
        contactId: "c1",
        contactName: "Alpha",
        bankAccountName: "Main",
        bsb: "111",
        accountNumber: "AAA",
        normalizedBankRef: "111AAA"
      },
      {
        lineKey: "l2",
        contactId: "c2",
        contactName: "Beta",
        bankAccountName: "Ops",
        bsb: "222",
        accountNumber: "BBB",
        normalizedBankRef: "222BBB"
      }
    ];

    const current = [
      {
        lineKey: "l1",
        contactId: "c1",
        contactName: "Alpha",
        bankAccountName: "Main",
        bsb: "111",
        accountNumber: "AAA",
        normalizedBankRef: "111AAA"
      },
      {
        lineKey: "l3",
        contactId: "c3",
        contactName: "Gamma",
        bankAccountName: "New",
        bsb: "333",
        accountNumber: "CCC",
        normalizedBankRef: "333CCC"
      },
      {
        lineKey: "l2",
        contactId: "c2",
        contactName: "Beta Renamed",
        bankAccountName: "Ops",
        bsb: "222",
        accountNumber: "BBB",
        normalizedBankRef: "222BBB"
      }
    ];

    const result = diffBankAccountSnapshots({ previous, current });
    expect(result.added).toEqual(["l3"]);
    expect(result.removed).toEqual([]);
    expect(result.changed).toEqual(["l2"]);
    expect(result.summary).toMatchObject({
      previousCount: 2,
      currentCount: 3,
      addedCount: 1,
      removedCount: 0,
      changedCount: 1
    });
  });
});
