import { NextResponse } from "next/server";

import { diffBankAccountSnapshots } from "@/lib/alerts/diff-accounts";
import { validateAdminInternalRouteAuth } from "@/lib/auth/internal-route-auth";
import { saveAccountSnapshot } from "@/lib/db/account-snapshots";
import { createAlertFromProcessEventDiff } from "@/lib/db/alerts";
import { getWebhookEventForProcessing, getLatestAccountSnapshotByTenant } from "@/lib/db/process-event";
import { getEnv } from "@/lib/env";
import { pipelineDebug } from "@/lib/server/pipeline-debug";
import { runNotifyJob } from "@/lib/jobs/notify";
import { fetchContactBankLineSnapshot } from "@/lib/xero/accounts";
import { getTenantAccessToken } from "@/lib/xero/refresh";
import { z } from "zod";

function extractTenantId(payload: unknown) {
  const data = payload as {
    events?: Array<{ tenantId?: string; tenantID?: string }>;
  };
  const event = Array.isArray(data.events) ? data.events[0] : undefined;
  return event?.tenantId ?? event?.tenantID ?? null;
}

const processEventBodySchema = z
  .object({
    webhookEventId: z.string().trim().min(1).max(128).optional(),
    idempotencyKey: z.string().trim().min(1).max(128).optional()
  })
  .strict()
  .refine((value) => Boolean(value.webhookEventId || value.idempotencyKey), {
    message: "Either webhookEventId or idempotencyKey is required"
  });

export async function POST(request: Request) {
  const env = getEnv();
  const internalAuth = validateAdminInternalRouteAuth(request, env);
  if (!internalAuth.ok) {
    return internalAuth.response;
  }

  if (!env.XERO_CLIENT_ID || !env.XERO_CLIENT_SECRET || !env.TOKEN_ENCRYPTION_KEY) {
    return NextResponse.json(
      {
        message:
          "Missing required environment variables: XERO_CLIENT_ID, XERO_CLIENT_SECRET, TOKEN_ENCRYPTION_KEY"
      },
      { status: 500 }
    );
  }

  const contentType = request.headers.get("content-type");
  if (!contentType?.toLowerCase().includes("application/json")) {
    return NextResponse.json({ message: "Content-Type must be application/json" }, { status: 415 });
  }

  let body: z.infer<typeof processEventBodySchema>;
  try {
    body = processEventBodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  await pipelineDebug("process_event_start", {
    webhookEventId: body.webhookEventId,
    idempotencyKeyPrefix: body.idempotencyKey?.slice(0, 12)
  });

  const event = await getWebhookEventForProcessing({
    webhookEventId: body.webhookEventId,
    idempotencyKey: body.idempotencyKey
  });

  if (!event) {
    return NextResponse.json({ message: "Webhook event not found" }, { status: 404 });
  }

  const tenantId = extractTenantId(event.payload);
  if (!tenantId) {
    return NextResponse.json({ message: "Webhook payload missing tenantId" }, { status: 400 });
  }
  if (env.XERO_ALLOWED_TENANT_ID && env.XERO_ALLOWED_TENANT_ID !== tenantId) {
    return NextResponse.json({ message: "tenantId is not permitted" }, { status: 403 });
  }

  try {
    const previousSnapshot = await getLatestAccountSnapshotByTenant(tenantId);
    const token = await getTenantAccessToken({
      tenantId,
      encryptionKey: env.TOKEN_ENCRYPTION_KEY,
      xeroClientId: env.XERO_CLIENT_ID,
      xeroClientSecret: env.XERO_CLIENT_SECRET
    });
    const currentLines = await fetchContactBankLineSnapshot(token.accessToken);
    const diff = diffBankAccountSnapshots({
      previous: previousSnapshot?.contactBankLines ?? [],
      current: currentLines
    });

    const persisted = await saveAccountSnapshot({
      tenantId,
      source: "webhook_process_event",
      contactBankLines: currentLines
    });
    const alert = await createAlertFromProcessEventDiff({
      tenantId,
      webhookEventId: event.id,
      idempotencyKey: event.idempotencyKey,
      diff
    });

    const notify = await runNotifyJob(
      {
        tenantId,
        idempotencyKey: event.idempotencyKey,
        diff
      },
      env
    );

    return NextResponse.json(
      {
        message: "Webhook event processed",
        tenantId,
        idempotencyKey: event.idempotencyKey,
        tokenSource: token.source,
        snapshot: persisted,
        diff,
        alert,
        notify
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Process-event execution failed", error);
    return NextResponse.json({ message: "Process-event execution failed" }, { status: 500 });
  }
}
