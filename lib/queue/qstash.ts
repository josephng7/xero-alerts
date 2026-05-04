import { pipelineDebug } from "@/lib/server/pipeline-debug";

/** Upstash QStash API origin when `QSTASH_URL` is not set. */
export const DEFAULT_QSTASH_URL = "https://qstash.upstash.io";

/**
 * Publish a POST delivery to QStash for an absolute destination URL.
 * QStash will POST `payload` as JSON and forward `internalApiSecret` as `x-internal-api-secret`.
 */
export async function publishQstashJob(params: {
  qstashUrl: string;
  qstashToken: string;
  destinationUrl: string;
  internalApiSecret: string;
  payload: unknown;
}): Promise<{ messageId: string | null }> {
  const qstashOrigin = params.qstashUrl.replace(/\/$/, "");
  let destinationHost = "";
  try {
    destinationHost = new URL(params.destinationUrl).host;
  } catch {
    destinationHost = "(invalid-destination-url)";
  }

  const publishUrl = `${qstashOrigin}/v2/publish/${encodeURIComponent(params.destinationUrl)}`;

  pipelineDebug("qstash_publish_start", {
    qstashApiHost: new URL(qstashOrigin).host,
    destinationHost
  });

  const response = await fetch(publishUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.qstashToken}`,
      "Content-Type": "application/json",
      "Upstash-Forward-x-internal-api-secret": params.internalApiSecret
    },
    body: JSON.stringify(params.payload)
  });

  if (!response.ok) {
    const text = await response.text();
    pipelineDebug("qstash_publish_http_error", {
      status: response.status,
      bodyPrefix: text.slice(0, 200)
    });
    throw new Error(`QStash publish failed (${response.status}): ${text}`);
  }

  const body = (await response.json().catch(() => ({}))) as { messageId?: string };
  const messageId = body.messageId ?? null;
  pipelineDebug("qstash_publish_ok", { messageId, destinationHost });
  return { messageId };
}

export async function enqueueProcessEventJob(params: {
  qstashUrl: string;
  qstashToken: string;
  callbackBaseUrl: string;
  payload: unknown;
  /** Forwarded to the destination URL as `x-internal-api-secret` (QStash `Upstash-Forward-*`). */
  internalApiSecret: string;
}) {
  const destinationUrl = new URL("/api/jobs/process-event", params.callbackBaseUrl).toString();
  return publishQstashJob({
    qstashUrl: params.qstashUrl,
    qstashToken: params.qstashToken,
    destinationUrl,
    internalApiSecret: params.internalApiSecret,
    payload: params.payload
  });
}
