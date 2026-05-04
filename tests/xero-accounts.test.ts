import { describe, expect, it } from "vitest";

import { __internal } from "@/lib/xero/accounts";

describe("contact bank line mapping", () => {
  it("uses BankAccountID in line key when present", () => {
    const key = __internal.buildLineKey(
      "contact-1",
      {
        BankAccountID: "bank-guid-9",
        BSB: "062000",
        AccountNumber: "12345678"
      },
      0
    );
    expect(key).toBe("contact-1:bank-guid-9");
  });

  it("maps a bank row into a snapshot line", () => {
    const line = __internal.mapBankLine(
      "contact-1",
      "Acme Ltd",
      {
        AccountName: "AUD",
        BSB: "062000",
        AccountNumber: "12345678"
      },
      0
    );
    expect(line.lineKey).toContain("contact-1");
    expect(line.contactName).toBe("Acme Ltd");
    expect(line.bsb).toBe("062000");
    expect(line.accountNumber).toBe("12345678");
    expect(line.normalizedBankRef).toBeTruthy();
  });
});
