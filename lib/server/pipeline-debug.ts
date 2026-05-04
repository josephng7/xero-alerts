/**
 * Optional verbose logging for webhook → QStash → worker.
 * Set `PIPELINE_DEBUG=1` in the environment. Never log secrets or full tokens.
 */
export function isPipelineDebugEnabled(): boolean {
  return process.env.PIPELINE_DEBUG === "1";
}

export function pipelineDebug(event: string, meta?: Record<string, unknown>): void {
  if (!isPipelineDebugEnabled()) return;
  const line = { event, ...meta };
  console.info(`[pipeline] ${JSON.stringify(line)}`);
}
