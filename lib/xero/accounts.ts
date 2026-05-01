export type XeroBankAccountSnapshot = {
  accountId: string;
  code: string | null;
  name: string;
  type: string | null;
  status: string | null;
  bankAccountNumber: string | null;
  currencyCode: string | null;
  updatedDateUtc: string | null;
};

function mapBankAccounts(payload: unknown): XeroBankAccountSnapshot[] {
  const rows = Array.isArray((payload as { Accounts?: unknown[] })?.Accounts)
    ? (payload as { Accounts: unknown[] }).Accounts
    : [];

  return rows
    .map((item) => item as Record<string, unknown>)
    .filter((item) => item.AccountID && item.Name && item.Type === "BANK")
    .map((item) => ({
      accountId: String(item.AccountID),
      code: item.Code ? String(item.Code) : null,
      name: String(item.Name),
      type: item.Type ? String(item.Type) : null,
      status: item.Status ? String(item.Status) : null,
      bankAccountNumber: item.BankAccountNumber ? String(item.BankAccountNumber) : null,
      currencyCode: item.CurrencyCode ? String(item.CurrencyCode) : null,
      updatedDateUtc: item.UpdatedDateUTC ? String(item.UpdatedDateUTC) : null
    }));
}

export async function fetchBankAccountSnapshot(accessToken: string) {
  const response = await fetch("https://api.xero.com/api.xro/2.0/Accounts", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Xero account fetch failed (${response.status}): ${text}`);
  }

  const payload = await response.json();
  return mapBankAccounts(payload);
}

export const __internal = {
  mapBankAccounts
};
