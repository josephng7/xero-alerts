import { desc } from "drizzle-orm";

import { accountSnapshots, getDb, webhookEvents } from "@/lib/db/index";

type SnapshotPayload = {
  accounts?: unknown;
};

type WebhookPayload = {
  events?: Array<Record<string, unknown>>;
};

export type UiSnapshotSummary = {
  fetchedAt: string;
  source: string;
  accountCount: number;
} | null;

export type UiWebhookEventRow = {
  id: string;
  receivedAt: string;
  eventCategory: string | null;
  status: "received" | "untyped";
};

export type UiDashboardBaseline = {
  snapshot: UiSnapshotSummary;
  latestWebhookReceivedAt: string | null;
  webhookEvents: UiWebhookEventRow[];
};

export function extractAccountCount(payload: unknown): number {
  const data = payload as SnapshotPayload;
  return Array.isArray(data?.accounts) ? data.accounts.length : 0;
}

export function deriveEventStatus(payload: unknown, eventCategory: string | null) {
  if (eventCategory) {
    return "received" as const;
  }
  const data = payload as WebhookPayload;
  return Array.isArray(data?.events) && data.events.length > 0 ? "received" : "untyped";
}

export async function getUiDashboardBaseline(): Promise<UiDashboardBaseline> {
  try {
    const db = getDb();
    const [latestSnapshot] = await db
      .select({
        fetchedAt: accountSnapshots.fetchedAt,
        source: accountSnapshots.source,
        payload: accountSnapshots.payload
      })
      .from(accountSnapshots)
      .orderBy(desc(accountSnapshots.fetchedAt))
      .limit(1);

    const recentWebhookEvents = await db
      .select({
        id: webhookEvents.id,
        receivedAt: webhookEvents.receivedAt,
        eventCategory: webhookEvents.eventCategory,
        payload: webhookEvents.payload
      })
      .from(webhookEvents)
      .orderBy(desc(webhookEvents.receivedAt))
      .limit(10);

    return {
      snapshot: latestSnapshot
        ? {
            fetchedAt: latestSnapshot.fetchedAt.toISOString(),
            source: latestSnapshot.source,
            accountCount: extractAccountCount(latestSnapshot.payload)
          }
        : null,
      latestWebhookReceivedAt: recentWebhookEvents[0]?.receivedAt.toISOString() ?? null,
      webhookEvents: recentWebhookEvents.map((event) => ({
        id: event.id,
        receivedAt: event.receivedAt.toISOString(),
        eventCategory: event.eventCategory,
        status: deriveEventStatus(event.payload, event.eventCategory)
      }))
    };
  } catch {
    return {
      snapshot: null,
      latestWebhookReceivedAt: null,
      webhookEvents: []
    };
  }
}
