import { and, desc, eq, lt } from "drizzle-orm";

import type { NotificationDiff } from "@/lib/notifications/logic";
import { isActionableDiff } from "@/lib/notifications/logic";

import { alerts, getDb, organizations } from "@/lib/db/index";

export type AlertRow = {
  id: string;
  organizationId: string;
  xeroTenantId: string;
  source: string;
  webhookEventId: string | null;
  idempotencyKey: string | null;
  title: string;
  diff: NotificationDiff;
  acknowledgedAt: string | null;
  createdAt: string;
};

function buildAlertTitle(summary: NotificationDiff["summary"]): string {
  const parts: string[] = [];
  if (summary.addedCount > 0) {
    parts.push(`+${summary.addedCount}`);
  }
  if (summary.removedCount > 0) {
    parts.push(`-${summary.removedCount}`);
  }
  if (summary.changedCount > 0) {
    parts.push(`~${summary.changedCount}`);
  }
  return parts.length > 0
    ? `Contact bank details changed (${parts.join(", ")})`
    : "Contact bank details changed";
}

/**
 * Creates one alert per webhook-processed diff when the diff is actionable.
 * Idempotent per webhook event id.
 */
export async function createAlertFromProcessEventDiff(params: {
  tenantId: string;
  webhookEventId: string;
  idempotencyKey: string;
  diff: NotificationDiff;
}): Promise<{ created: boolean; alertId: string | null }> {
  if (!isActionableDiff(params.diff.summary)) {
    return { created: false, alertId: null };
  }

  const db = getDb();
  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.xeroTenantId, params.tenantId)
  });
  if (!organization) {
    console.error("createAlertFromProcessEventDiff: organization not found", params.tenantId);
    return { created: false, alertId: null };
  }

  const existing = await db.query.alerts.findFirst({
    where: eq(alerts.webhookEventId, params.webhookEventId)
  });
  if (existing) {
    return { created: false, alertId: existing.id };
  }

  const [inserted] = await db
    .insert(alerts)
    .values({
      organizationId: organization.id,
      xeroTenantId: params.tenantId,
      source: "process_event_diff",
      webhookEventId: params.webhookEventId,
      idempotencyKey: params.idempotencyKey,
      title: buildAlertTitle(params.diff.summary),
      diff: params.diff
    })
    .returning({ id: alerts.id });

  return { created: true, alertId: inserted?.id ?? null };
}

export type ListAlertsParams = {
  tenantId?: string;
  allowedTenantId?: string | null;
  limit: number;
  cursor?: string | null;
};

export async function listAlerts(params: ListAlertsParams): Promise<{
  items: AlertRow[];
  nextCursor: string | null;
}> {
  const db = getDb();
  const effectiveTenant =
    params.allowedTenantId && params.allowedTenantId.length > 0
      ? params.allowedTenantId
      : params.tenantId;

  const conditions = [];
  if (effectiveTenant) {
    conditions.push(eq(alerts.xeroTenantId, effectiveTenant));
  }
  if (params.cursor) {
    conditions.push(lt(alerts.createdAt, new Date(params.cursor)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: alerts.id,
      organizationId: alerts.organizationId,
      xeroTenantId: alerts.xeroTenantId,
      source: alerts.source,
      webhookEventId: alerts.webhookEventId,
      idempotencyKey: alerts.idempotencyKey,
      title: alerts.title,
      diff: alerts.diff,
      acknowledgedAt: alerts.acknowledgedAt,
      createdAt: alerts.createdAt
    })
    .from(alerts)
    .where(whereClause)
    .orderBy(desc(alerts.createdAt))
    .limit(params.limit + 1);

  const hasMore = rows.length > params.limit;
  const page = hasMore ? rows.slice(0, params.limit) : rows;
  const last = page[page.length - 1];

  return {
    items: page.map((r) => ({
      id: r.id,
      organizationId: r.organizationId,
      xeroTenantId: r.xeroTenantId,
      source: r.source,
      webhookEventId: r.webhookEventId,
      idempotencyKey: r.idempotencyKey,
      title: r.title,
      diff: r.diff as unknown as NotificationDiff,
      acknowledgedAt: r.acknowledgedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString()
    })),
    nextCursor: hasMore && last ? last.createdAt.toISOString() : null
  };
}

export async function getAlertById(id: string): Promise<AlertRow | null> {
  const db = getDb();
  const [row] = await db
    .select({
      id: alerts.id,
      organizationId: alerts.organizationId,
      xeroTenantId: alerts.xeroTenantId,
      source: alerts.source,
      webhookEventId: alerts.webhookEventId,
      idempotencyKey: alerts.idempotencyKey,
      title: alerts.title,
      diff: alerts.diff,
      acknowledgedAt: alerts.acknowledgedAt,
      createdAt: alerts.createdAt
    })
    .from(alerts)
    .where(eq(alerts.id, id))
    .limit(1);

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    organizationId: row.organizationId,
    xeroTenantId: row.xeroTenantId,
    source: row.source,
    webhookEventId: row.webhookEventId,
    idempotencyKey: row.idempotencyKey,
    title: row.title,
    diff: row.diff as unknown as NotificationDiff,
    acknowledgedAt: row.acknowledgedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString()
  };
}

export async function acknowledgeAlert(id: string): Promise<{ updated: boolean }> {
  const db = getDb();
  const now = new Date();
  const [row] = await db
    .update(alerts)
    .set({ acknowledgedAt: now })
    .where(eq(alerts.id, id))
    .returning({ id: alerts.id });

  return { updated: Boolean(row) };
}
