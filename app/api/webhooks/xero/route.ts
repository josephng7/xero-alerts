import { NextResponse } from "next/server";

import { recordWebhookEvent } from "@/lib/db/webhook-events";
import { getEnv } from "@/lib/env";
import { DEFAULT_QSTASH_URL, enqueueProcessEventJob } from "@/lib/queue/qstash";
import { getAppBaseUrl } from "@/lib/server/app-base-url";
import { verifyXeroWebhookSignature } from "@/lib/signature";

const MAX_WEBHOOK_BODY_BYTES = 256 * 1024;

export async function POST(request: Request) {
  const env = getEnv();
  if (!env.XERO_WEBHOOK_KEY) {
    return NextResponse.json({ message: "XERO_WEBHOOK_KEY is not configured" }, { status: 500 });
  }

  const contentType = request.headers.get("content-type");
  if (!contentType?.toLowerCase().includes("application/json")) {
    return NextResponse.json({ message: "Content-Type must be application/json" }, { status: 415 });
  }

  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader) {
    const contentLength = Number.parseInt(contentLengthHeader, 10);
    if (Number.isFinite(contentLength) && contentLength > MAX_WEBHOOK_BODY_BYTES) {
      return NextResponse.json({ message: "Payload too large" }, { status: 413 });
    }
  }

  const signature = request.headers.get("x-xero-signature");
  const rawBody = Buffer.from(await request.arrayBuffer());
  const isValid = verifyXeroWebhookSignature(rawBody, signature, env.XERO_WEBHOOK_KEY);

  if (!isValid) {
    return NextResponse.json({ message: "Invalid webhook signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody.toString("utf8")) as unknown;
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const recorded = await recordWebhookEvent({ rawBody, payload });
  if (!recorded.inserted) {
    return NextResponse.json(
      {
        message: "Duplicate webhook ignored",
        idempotencyKey: recorded.idempotencyKey
      },
      { status: 200 }
    );
  }

  if (env.QSTASH_TOKEN) {
    if (!env.INTERNAL_ADMIN_SECRET) {
      return NextResponse.json(
        {
          message:
            "Queue handoff requires INTERNAL_ADMIN_SECRET so QStash can forward x-internal-api-secret to the worker"
        },
        { status: 500 }
      );
    }
    const qstashUrl = env.QSTASH_URL ?? DEFAULT_QSTASH_URL;
    try {
      const enqueue = await enqueueProcessEventJob({
        qstashUrl,
        qstashToken: env.QSTASH_TOKEN,
        callbackBaseUrl: getAppBaseUrl(),
        internalApiSecret: env.INTERNAL_ADMIN_SECRET,
        payload: {
          webhookEventId: recorded.webhookEventId,
          idempotencyKey: recorded.idempotencyKey
        }
      });

      return NextResponse.json(
        {
          message: "Webhook accepted and queued",
          idempotencyKey: recorded.idempotencyKey,
          queue: { provider: "qstash", messageId: enqueue.messageId }
        },
        { status: 202 }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Queue publish failed";
      return NextResponse.json(
        {
          message: "Webhook stored but queue handoff failed",
          idempotencyKey: recorded.idempotencyKey,
          queueError: message
        },
        { status: 202 }
      );
    }
  }

  return NextResponse.json(
    {
      message: "Webhook accepted (queue not configured)",
      idempotencyKey: recorded.idempotencyKey
    },
    { status: 202 }
  );
}
