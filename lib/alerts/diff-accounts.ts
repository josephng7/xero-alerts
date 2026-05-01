import { normalizeBankDetails } from "@/lib/normalize-bank";
import type { XeroBankAccountSnapshot } from "@/lib/xero/accounts";

type AccountDigest = {
  accountId: string;
  name: string;
  status: string | null;
  code: string | null;
  normalizedBankRef: string | null;
};

function digest(account: XeroBankAccountSnapshot): AccountDigest {
  return {
    accountId: account.accountId,
    name: account.name,
    status: account.status,
    code: account.code,
    normalizedBankRef: account.bankAccountNumber
      ? normalizeBankDetails(account.bankAccountNumber)
      : null
  };
}

export function diffBankAccountSnapshots(params: {
  previous: XeroBankAccountSnapshot[];
  current: XeroBankAccountSnapshot[];
}) {
  const previousMap = new Map(params.previous.map((a) => [a.accountId, digest(a)]));
  const currentMap = new Map(params.current.map((a) => [a.accountId, digest(a)]));

  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];

  for (const [accountId, current] of currentMap) {
    const prev = previousMap.get(accountId);
    if (!prev) {
      added.push(accountId);
      continue;
    }

    if (
      prev.name !== current.name ||
      prev.status !== current.status ||
      prev.code !== current.code ||
      prev.normalizedBankRef !== current.normalizedBankRef
    ) {
      changed.push(accountId);
    }
  }

  for (const accountId of previousMap.keys()) {
    if (!currentMap.has(accountId)) {
      removed.push(accountId);
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
