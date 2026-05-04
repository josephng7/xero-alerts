import { eq, sql } from "drizzle-orm";

import { appRuntimeSettings, getDb } from "./index";

const SINGLETON_ID = 1;
const CACHE_TTL_MS = 15_000;

type MemoryCache = { value: boolean; fetchedAt: number };
let pipelineDebugMemoryCache: MemoryCache | null = null;

/** Clears the in-process cache so the next read hits Postgres (or skips if env forces on). */
export function invalidatePipelineDebugCache(): void {
  pipelineDebugMemoryCache = null;
}

async function readPipelineDebugFromDb(): Promise<boolean> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return false;
  try {
    const db = getDb();
    const rows = await db
      .select({ pipelineDebug: appRuntimeSettings.pipelineDebug })
      .from(appRuntimeSettings)
      .where(eq(appRuntimeSettings.id, SINGLETON_ID))
      .limit(1);
    return rows[0]?.pipelineDebug ?? false;
  } catch {
    return false;
  }
}

/**
 * True when `PIPELINE_DEBUG=1` **or** the singleton row `app_runtime_settings.pipeline_debug` is true.
 * Uses a short in-memory TTL to avoid extra reads on hot paths; call `invalidatePipelineDebugCache` after updates.
 */
export async function getPipelineDebugEnabledCached(): Promise<boolean> {
  if (process.env.PIPELINE_DEBUG === "1") return true;
  if (pipelineDebugMemoryCache && Date.now() - pipelineDebugMemoryCache.fetchedAt < CACHE_TTL_MS) {
    return pipelineDebugMemoryCache.value;
  }
  const value = await readPipelineDebugFromDb();
  pipelineDebugMemoryCache = { value, fetchedAt: Date.now() };
  return value;
}

export async function setPipelineDebugEnabled(enabled: boolean): Promise<void> {
  const db = getDb();
  await db
    .insert(appRuntimeSettings)
    .values({ id: SINGLETON_ID, pipelineDebug: enabled })
    .onConflictDoUpdate({
      target: appRuntimeSettings.id,
      set: { pipelineDebug: enabled, updatedAt: sql`now()` }
    });
  invalidatePipelineDebugCache();
}

export async function getPipelineDebugRow(): Promise<{ pipelineDebug: boolean; updatedAt: Date } | null> {
  const db = getDb();
  const rows = await db
    .select({
      pipelineDebug: appRuntimeSettings.pipelineDebug,
      updatedAt: appRuntimeSettings.updatedAt
    })
    .from(appRuntimeSettings)
    .where(eq(appRuntimeSettings.id, SINGLETON_ID))
    .limit(1);
  return rows[0] ?? null;
}
