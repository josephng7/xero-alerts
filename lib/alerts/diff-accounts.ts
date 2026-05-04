import { normalizeBankDetails } from "@/lib/normalize-bank";
import type { XeroContactBankLineSnapshot } from "@/lib/xero/accounts";

type LineDigest = {
  contactName: string;
  bankAccountName: string | null;
  bsb: string | null;
  accountNumber: string | null;
  normalizedBankRef: string | null;
};

function digest(line: XeroContactBankLineSnapshot): LineDigest {
  return {
    contactName: line.contactName,
    bankAccountName: line.bankAccountName,
    bsb: line.bsb,
    accountNumber: line.accountNumber,
    normalizedBankRef: line.normalizedBankRef
  };
}

export function diffBankAccountSnapshots(params: {
  previous: XeroContactBankLineSnapshot[];
  current: XeroContactBankLineSnapshot[];
}) {
  const previousMap = new Map(params.previous.map((l) => [l.lineKey, digest(l)]));
  const currentMap = new Map(params.current.map((l) => [l.lineKey, digest(l)]));

  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];

  for (const [lineKey, current] of currentMap) {
    const prev = previousMap.get(lineKey);
    if (!prev) {
      added.push(lineKey);
      continue;
    }

    if (
      prev.contactName !== current.contactName ||
      prev.bankAccountName !== current.bankAccountName ||
      prev.bsb !== current.bsb ||
      prev.accountNumber !== current.accountNumber ||
      prev.normalizedBankRef !== current.normalizedBankRef
    ) {
      changed.push(lineKey);
    }
  }

  for (const lineKey of previousMap.keys()) {
    if (!currentMap.has(lineKey)) {
      removed.push(lineKey);
    }
  }

  return {
    added,
    removed,
    changed,
    summary: {
      previousCount: params.previous.length,
      currentCount: params.current.length,
      addedCount: added.length,
      removedCount: removed.length,
      changedCount: changed.length
    }
  };
}
