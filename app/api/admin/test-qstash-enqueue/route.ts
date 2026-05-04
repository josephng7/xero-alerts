import { NextResponse } from "next/server";
import { z } from "zod";

import { validateAdminInternalRouteAuth } from "@/lib/auth/internal-route-auth";
import { getEnv } from "@/lib/env";
import { DEFAULT_QSTASH_URL, publishQstashJob } from "@/lib/queue/qstash";
import { getAppBaseUrl } from "@/lib/server/app-base-url";
import { pipelineDebug } from "@/lib/server/pipeline-debug";

/** Same string bounds as `POST /api/jobs/process-event` so QStash deliveries are not rejected after publish. */
const testEnqueueBodySchema = z
  .object({
    target: z.enum(["smoke", "process-event"]).optional(),
    webhookEventId: z.string().trim().min(1).max(128).optional(),
    idempotencyKey: z.string().trim().min(1).max(128).optional()
  })
  .strict()
  .superRefine((val, ctx) => {
    const target = val.target ?? "smoke";
    if (target === "process-event" && !val.webhookEventId && !val.idempotencyKey) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "target process-event requires webhookEventId or idempotencyKey"
      });
    }
  });

/**
 * Operator-only: publish one QStash message from this deployment (same path as webhook enqueue).
 * Use `target: "smoke"` (default) to verify QStash + delivery without touching Xero.
 */
export async function POST(request: Request) {
  const env = getEnv();
  const internalAuth = validateAdminInternalRouteAuth(request, env);
  if (!internalAuth.ok) {
    return internalAuth.response;
  }

  if (!env.QSTASH_TOKEN) {
    return NextResponse.json({ message: "QSTASH_TOKEN is not configured" }, { status: 400 });
  }
  if (!env.INTERNAL_ADMIN_SECRET) {
    return NextResponse.json({ message: "INTERNAL_ADMIN_SECRET is not configured" }, { status: 500 });
  }

  const contentType = request.headers.get("content-type");
  if (contentType && !contentType.toLowerCase().includes("application/json")) {
    return NextResponse.json({ message: "Content-Type must be application/json when set" }, { status: 415 });
  }

  let rawBody = "";
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ message: "Invalid body" }, { status: 400 });
  }

  let parsedJson: unknown = {};
  if (rawBody.trim()) {
    try {
      parsedJson = JSON.parse(rawBody) as unknown;
    } catch {
      return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
    }
  }

  let body: z.infer<typeof testEnqueueBodySchema>;
  try {
    body = testEnqueueBodySchema.parse(parsedJson);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid request body", issues: e.issues }, { status: 400 });
    }
    throw e;
  }

  const target = body.target ?? "smoke";
  const callbackBaseUrl = getAppBaseUrl();
  const qstashUrl = env.QSTASH_URL ?? DEFAULT_QSTASH_URL;

  const destinationUrl =
    target === "smoke"
      ? new URL("/api/admin/qstash-smoke", callbackBaseUrl).toString()
      : new URL("/api/jobs/process-event", callbackBaseUrl).toString();

  const payload =
    target === "smoke"
      ? { source: "admin-test-qstash-enqueue", at: new Date().toISOString() }
      : {
          ...(body.webhookEventId ? { webhookEventId: body.webhookEventId } : {}),
          ...(body.idempotencyKey ? { idempotencyKey: body.idempotencyKey } : {})
        };

  await pipelineDebug("admin_test_qstash_enqueue", { target, destinationHost: new URL(destinationUrl).host });

  try {
    const result = await publishQstashJob({
      qstashUrl,
      qstashToken: env.QSTASH_TOKEN,
      destinationUrl,
      internalApiSecret: env.INTERNAL_ADMIN_SECRET,
      payload
    });

    return NextResponse.json(
      {
        message: "QStash publish accepted",
        target,
        messageId: result.messageId,
        destinationUrl,
        qstashApiHost: new URL(qstashUrl).host
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "QStash publish failed";
    console.error("[admin/test-qstash-enqueue] publish_failed", message);
    return NextResponse.json({ message: "QStash publish failed", detail: message }, { status: 502 });
  }
}
