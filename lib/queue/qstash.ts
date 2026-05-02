/** Upstash QStash API origin when `QSTASH_URL` is not set. */
export const DEFAULT_QSTASH_URL = "https://qstash.upstash.io";

export async function enqueueProcessEventJob(params: {
  qstashUrl: string;
  qstashToken: string;
  callbackBaseUrl: string;
  payload: unknown;
}) {
  const target = new URL("/api/jobs/process-event", params.callbackBaseUrl).toString();
  const publishUrl = `${params.qstashUrl.replace(/\/$/, "")}/v2/publish/${encodeURIComponent(target)}`;

  const response = await fetch(publishUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.qstashToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(params.payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`QStash publish failed (${response.status}): ${text}`);
  }

  const body = (await response.json().catch(() => ({}))) as { messageId?: string };
  return {
    messageId: body.messageId ?? null
  };
}
