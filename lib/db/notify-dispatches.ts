import { createHash } from "node:crypto";

import { eq } from "drizzle-orm";

import { getDb, notifyDispatches } from "@/lib/db/index";
import type { NotificationPayload } from "@/lib/notifications/logic";

type NotifyDigest = {
  tenantId: string;
  sourceIdempotencyKey: string | null;
  added: string[];
  removed: string[];
  changed: string[];
  summary: NotificationPayload["diff"]["summary"];
};

function sortCopy(values: string[]) {
  return [...values].sort((a, b) => a.localeCompare(b));
}

function buildDigest(payload: NotificationPayload): NotifyDigest {
  return {
    tenantId: payload.tenantId,
    sourceIdempotencyKey: payload.idempotencyKey ?? null,
    added: sortCopy(payload.diff.added),
    removed: sortCopy(payload.diff.removed),
    changed: sortCopy(payload.diff.changed),
    summary: payload.diff.summary
  };
}

export function computeNotifyDedupeKey(payload: NotificationPayload) {
  const digest = buildDigest(payload);
  return createHash("sha256").update(JSON.stringify(digest)).digest("hex");
}

export async function recordNotifyDispatchIfNew(payload: NotificationPayload) {
  const db = getDb();
  const digest = buildDigest(payload);
  const dedupeKey = computeNotifyDedupeKey(payload);

  const inserted = await db
    .insert(notifyDispatches)
    .values({
      tenantId: payload.tenantId,
      sourceIdempotencyKey: payload.idempotencyKey ?? null,
      dedupeKey,
      payloadDigest: digest
    })
    .onConflictDoNothing({
      target: notifyDispatches.dedupeKey
    })
    .returning({
      id: notifyDispatches.id
    });

  return {
    dedupeKey,
    inserted: inserted.length > 0
  };
}

export async function removeNotifyDispatchByDedupeKey(dedupeKey: string) {
  const db = getDb();
  await db.delete(notifyDispatches).where(eq(notifyDispatches.dedupeKey, dedupeKey));
}
