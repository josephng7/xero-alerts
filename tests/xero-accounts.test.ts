import { describe, expect, it } from "vitest";

import { __internal } from "@/lib/xero/accounts";

describe("mapBankAccounts", () => {
  it("keeps only BANK accounts with required fields", () => {
    const mapped = __internal.mapBankAccounts({
      Accounts: [
        {
          AccountID: "a-1",
          Name: "Main Operating",
          Type: "BANK",
          Status: "ACTIVE",
          CurrencyCode: "USD"
        },
        {
          AccountID: "a-2",
          Name: "Receivables",
          Type: "CURRENT",
          Status: "ACTIVE"
        }
      ]
    });

    expect(mapped).toHaveLength(1);
    expect(mapped[0]).toMatchObject({
      accountId: "a-1",
      name: "Main Operating",
      type: "BANK"
    });
  });
});
