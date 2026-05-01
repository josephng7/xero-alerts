import { eq } from "drizzle-orm";

import { accountSnapshots, getDb, organizations, webhookEvents } from "@/lib/db/index";
import type { XeroBankAccountSnapshot } from "@/lib/xero/accounts";

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

  const payload = snapshot.payload as { accounts?: XeroBankAccountSnapshot[] };
  return {
    ...snapshot,
    accounts: Array.isArray(payload.accounts) ? payload.accounts : []
  };
}
