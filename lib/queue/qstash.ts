import { pipelineDebug } from "@/lib/server/pipeline-debug";

/** Upstash QStash API origin when `QSTASH_URL` is not set. */
export const DEFAULT_QSTASH_URL = "https://qstash.upstash.io";

/**
 * QStash HTTP API is always `<origin>/v2/publish/<encoded-destination>`.
 * If `QSTASH_URL` mistakenly includes `/v2/publish/` (older docs/dashboard copy-paste),
 * concatenating our own `/v2/publish/` breaks the request; Upstash may respond with
 * `invalid destination url: endpoint has invalid scheme`.
 */
export function normalizeQstashApiOrigin(input: string): string {
  const trimmed = input.trim().replace(/\/+$/, "");
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return new URL(withScheme).origin;
}

/**
 * Full URL for `POST /v2/publish/<destination>`.
 * The destination must appear as a **literal** `https://…` path segment (same as `@upstash/qstash` and Upstash curl examples).
 * Using `encodeURIComponent` on the whole destination turns `://` into `%3A%2F%2F`, which breaks QStash parsing and yields
 * `invalid destination url: endpoint has invalid scheme`.
 */
export function buildQstashPublishRequestUrl(qstashOrigin: string, destinationUrl: string): string {
  const base = normalizeQstashApiOrigin(qstashOrigin);
  return new URL(["v2", "publish", destinationUrl].join("/"), `${base}/`).toString();
}

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
  const qstashOrigin = normalizeQstashApiOrigin(params.qstashUrl);
  let destinationHost = "";
  try {
    destinationHost = new URL(params.destinationUrl).host;
  } catch {
    destinationHost = "(invalid-destination-url)";
  }

  const publishUrl = buildQstashPublishRequestUrl(qstashOrigin, params.destinationUrl);

  await pipelineDebug("qstash_publish_start", {
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
    await pipelineDebug("qstash_publish_http_error", {
      status: response.status,
      bodyPrefix: text.slice(0, 200)
    });
    throw new Error(`QStash publish failed (${response.status}): ${text}`);
  }

  const body = (await response.json().catch(() => ({}))) as { messageId?: string };
  const messageId = body.messageId ?? null;
  await pipelineDebug("qstash_publish_ok", { messageId, destinationHost });
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
