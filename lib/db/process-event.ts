import { eq } from "drizzle-orm";

import { accountSnapshots, getDb, organizations, webhookEvents } from "@/lib/db/index";
import type { XeroContactBankLineSnapshot } from "@/lib/xero/accounts";

export async function getWebhookEventForProcessing(params: {
  webhookEventId?: string;
  idempotencyKey?: string;
}) {
  const db = getDb();

  if (params.webhookEventId) {
    return (
      (await db.query.webhookEvents.findFirst({
        where: eq(webhookEvents.id, params.webhookEventId)
      })) ?? null
    );
  }

  if (params.idempotencyKey) {
    return (
      (await db.query.webhookEvents.findFirst({
        where: eq(webhookEvents.idempotencyKey, params.idempotencyKey)
      })) ?? null
    );
  }

  return null;
}

export async function getLatestAccountSnapshotByTenant(tenantId: string) {
  const db = getDb();
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.xeroTenantId, tenantId)
  });
  if (!org) {
    return null;
  }

  const snapshot = await db.query.accountSnapshots.findFirst({
    where: eq(accountSnapshots.organizationId, org.id)
  });
  if (!snapshot) {
    return null;
  }

  const payload = snapshot.payload as {
    schemaVersion?: number;
    contactBankLines?: XeroContactBankLineSnapshot[];
    /** Legacy chart-of-accounts bank rows (pre–contact-bank pivot). Not used for new diffs. */
    accounts?: unknown[];
  };
  const lines = Array.isArray(payload.contactBankLines) ? payload.contactBankLines : [];
  return {
    ...snapshot,
    contactBankLines: lines
  };
}
