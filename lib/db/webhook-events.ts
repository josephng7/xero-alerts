import { createHash } from "node:crypto";

import { getDb, webhookEvents } from "@/lib/db/index";

function deriveEventCategory(payload: unknown): string | null {
  const data = payload as { events?: Array<{ eventType?: string; eventCategory?: string }> };
  const first = Array.isArray(data?.events) ? data.events[0] : undefined;
  return first?.eventCategory ?? first?.eventType ?? null;
}

export function computeWebhookIdempotencyKey(rawBody: Buffer) {
  return createHash("sha256").update(rawBody).digest("hex");
}

export async function recordWebhookEvent(params: { rawBody: Buffer; payload: unknown }) {
  const idempotencyKey = computeWebhookIdempotencyKey(params.rawBody);
  const eventCategory = deriveEventCategory(params.payload);
  const db = getDb();

  const inserted = await db
    .insert(webhookEvents)
    .values({
      idempotencyKey,
      eventCategory,
      payload: params.payload
    })
    .onConflictDoNothing({
      target: webhookEvents.idempotencyKey
    })
    .returning({
      id: webhookEvents.id
    });

  return {
    idempotencyKey,
    inserted: inserted.length > 0,
    webhookEventId: inserted[0]?.id ?? null,
    eventCategory
  };
}
