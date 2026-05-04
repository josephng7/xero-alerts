import { eq } from "drizzle-orm";

import { accountSnapshots, getDb, organizations } from "@/lib/db/index";
import type { XeroContactBankLineSnapshot } from "@/lib/xero/accounts";

const DEFAULT_STALE_AFTER_MS = 15 * 60 * 1000;

export type SnapshotStaleness = {
  state: "missing" | "fresh" | "stale";
  staleAfterSeconds: number;
  ageSeconds: number | null;
  previousFetchedAt: string | null;
};

export async function getSnapshotStaleness(params: {
  tenantId: string;
  staleAfterMs?: number;
}): Promise<SnapshotStaleness> {
  const db = getDb();
  const staleAfterMs = params.staleAfterMs ?? DEFAULT_STALE_AFTER_MS;
  const staleAfterSeconds = Math.floor(staleAfterMs / 1000);

  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.xeroTenantId, params.tenantId)
  });
  if (!organization) {
    return {
      state: "missing",
      staleAfterSeconds,
      ageSeconds: null,
      previousFetchedAt: null
    };
  }

  const snapshot = await db.query.accountSnapshots.findFirst({
    where: eq(accountSnapshots.organizationId, organization.id)
  });
  if (!snapshot) {
    return {
      state: "missing",
      staleAfterSeconds,
      ageSeconds: null,
      previousFetchedAt: null
    };
  }

  const ageMs = Date.now() - snapshot.fetchedAt.getTime();
  return {
    state: ageMs > staleAfterMs ? "stale" : "fresh",
    staleAfterSeconds,
    ageSeconds: Math.max(0, Math.floor(ageMs / 1000)),
    previousFetchedAt: snapshot.fetchedAt.toISOString()
  };
}

export async function saveAccountSnapshot(params: {
  tenantId: string;
  source?: string;
  contactBankLines: XeroContactBankLineSnapshot[];
}) {
  const db = getDb();
  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.xeroTenantId, params.tenantId)
  });

  if (!organization) {
    throw new Error(`Organization not found for tenant ${params.tenantId}`);
  }

  const now = new Date();
  await db
    .insert(accountSnapshots)
    .values({
      organizationId: organization.id,
      source: params.source ?? "xero",
      payload: {
        schemaVersion: 2,
        contactBankLines: params.contactBankLines
      },
      fetchedAt: now
    })
    .onConflictDoUpdate({
      target: accountSnapshots.organizationId,
      set: {
        source: params.source ?? "xero",
        payload: {
          schemaVersion: 2,
          contactBankLines: params.contactBankLines
        },
        fetchedAt: now,
        updatedAt: now
      }
    });

  return {
    organizationId: organization.id,
    lineCount: params.contactBankLines.length,
    fetchedAt: now.toISOString()
  };
}
