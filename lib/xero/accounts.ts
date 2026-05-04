import { normalizeBankDetails } from "@/lib/normalize-bank";

const CONTACTS_URL = "https://api.xero.com/api.xro/2.0/Contacts";

/**
 * One contact bank detail line (Xero **Contact** → `BankAccounts[]`, not org chart `Accounts`).
 * Used for read-only `GET /Contacts` polling and diffs.
 */
export type XeroContactBankLineSnapshot = {
  lineKey: string;
  contactId: string;
  contactName: string;
  bankAccountName: string | null;
  bsb: string | null;
  accountNumber: string | null;
  normalizedBankRef: string | null;
};

function asRecord(v: unknown): Record<string, unknown> {
  return v !== null && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

function str(v: unknown): string | null {
  if (v === null || v === undefined) {
    return null;
  }
  const s = String(v).trim();
  return s.length > 0 ? s : null;
}

/** Stable id for diff: prefer Xero’s bank account id when present, else composite. */
function buildLineKey(
  contactId: string,
  bank: Record<string, unknown>,
  fallbackIndex: number
): string {
  const guid = bank.BankAccountID ?? bank.BankAccountId;
  if (guid !== undefined && guid !== null && String(guid).length > 0) {
    return `${contactId}:${String(guid)}`;
  }
  const bsb = str(bank.BSB ?? bank.Bsb) ?? "";
  const num = str(bank.AccountNumber ?? bank.accountNumber) ?? "";
  const accName = str(bank.AccountName ?? bank.BankAccountName) ?? "";
  if (bsb || num || accName) {
    return `${contactId}|${bsb}|${num}|${accName}`;
  }
  return `${contactId}:bank:${fallbackIndex}`;
}

function mapBankLine(
  contactId: string,
  contactName: string,
  bank: Record<string, unknown>,
  index: number
): XeroContactBankLineSnapshot {
  const lineKey = buildLineKey(contactId, bank, index);
  const bsb = str(bank.BSB ?? bank.Bsb);
  const accountNumber = str(bank.AccountNumber ?? bank.accountNumber);
  const bankAccountName = str(bank.AccountName ?? bank.BankAccountName);
  const rawRef = [bsb, accountNumber].filter(Boolean).join("|") || accountNumber || bsb;
  const normalizedBankRef = rawRef ? normalizeBankDetails(rawRef) : null;

  return {
    lineKey,
    contactId,
    contactName,
    bankAccountName,
    bsb,
    accountNumber,
    normalizedBankRef
  };
}

type XeroContactsPagination = {
  Page?: number;
  PageSize?: number;
  PageCount?: number;
  pageCount?: number;
};

type ContactsPagePayload = {
  Contacts?: unknown[];
  contacts?: unknown[];
  Pagination?: XeroContactsPagination;
  pagination?: XeroContactsPagination;
};

async function fetchContactsPage(
  accessToken: string,
  xeroTenantId: string,
  page: number
): Promise<ContactsPagePayload> {
  const url = new URL(CONTACTS_URL);
  url.searchParams.set("page", String(page));
  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      /** Required for Xero Accounting API; without it Xero often returns 403 AuthenticationUnsuccessful. */
      "Xero-tenant-id": xeroTenantId
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Xero contacts fetch failed (${response.status}): ${text}`);
  }

  return (await response.json()) as ContactsPagePayload;
}

/**
 * Read-only: paginates `GET /Contacts` and flattens each contact’s `BankAccounts` into snapshot lines.
 * Requires scope `accounting.contacts.read` (or legacy `accounting.contacts`).
 *
 * @param xeroTenantId Xero organisation id (same as connection `tenantId`, not connection row `id`).
 */
export async function fetchContactBankLineSnapshot(
  accessToken: string,
  xeroTenantId: string
): Promise<XeroContactBankLineSnapshot[]> {
  const lines: XeroContactBankLineSnapshot[] = [];
  let page = 1;
  let pageCount = 1;

  do {
    const payload = await fetchContactsPage(accessToken, xeroTenantId, page);
    const pagination = payload.Pagination ?? payload.pagination;
    const pages = pagination?.PageCount ?? pagination?.pageCount;
    if (typeof pages === "number" && pages >= 1) {
      pageCount = pages;
    }

    const contactsRaw = payload.Contacts ?? payload.contacts ?? [];
    for (const raw of contactsRaw) {
      const c = asRecord(raw);
      const contactId = str(c.ContactID ?? c.ContactId);
      if (!contactId) {
        continue;
      }
      const contactName = str(c.Name) ?? "(unnamed contact)";
      const banksRaw = c.BankAccounts ?? c.bankAccounts;
      const banks = Array.isArray(banksRaw) ? banksRaw : [];
      banks.forEach((bank, idx) => {
        lines.push(mapBankLine(contactId, contactName, asRecord(bank), idx));
      });
    }

    page += 1;
  } while (page <= pageCount);

  return lines;
}

export const __internal = {
  buildLineKey,
  mapBankLine
};
