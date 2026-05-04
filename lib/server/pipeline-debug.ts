import {
  getPipelineDebugEnabledCached,
  invalidatePipelineDebugCache
} from "@/lib/db/app-runtime-settings";

export { invalidatePipelineDebugCache };

/**
 * Verbose `[pipeline]` logs when enabled via **`PIPELINE_DEBUG=1`** (env override, no redeploy to turn off DB flag)
 * or **`app_runtime_settings.pipeline_debug`** (toggle via `PATCH /api/admin/runtime-settings` or SQL; no redeploy).
 */
export async function isPipelineDebugEnabled(): Promise<boolean> {
  return getPipelineDebugEnabledCached();
}

export async function pipelineDebug(event: string, meta?: Record<string, unknown>): Promise<void> {
  if (!(await getPipelineDebugEnabledCached())) return;
  const line = { event, ...meta };
  console.info(`[pipeline] ${JSON.stringify(line)}`);
}
