import { NextResponse } from "next/server";

import { validateAdminInternalRouteAuth } from "@/lib/auth/internal-route-auth";
import { saveAccountSnapshot } from "@/lib/db/account-snapshots";
import { getEnv } from "@/lib/env";
import { fetchContactBankLineSnapshot } from "@/lib/xero/accounts";
import { getTenantAccessToken } from "@/lib/xero/refresh";
import { z } from "zod";

const syncSnapshotsBodySchema = z
  .object({
    tenantId: z.string().trim().min(1).max(128)
  })
  .strict();

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

  let body: z.infer<typeof syncSnapshotsBodySchema>;
  try {
    body = syncSnapshotsBodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  if (env.XERO_ALLOWED_TENANT_ID && env.XERO_ALLOWED_TENANT_ID !== body.tenantId) {
    return NextResponse.json({ message: "tenantId is not permitted" }, { status: 403 });
  }

  try {
    const token = await getTenantAccessToken({
      tenantId: body.tenantId,
      encryptionKey: env.TOKEN_ENCRYPTION_KEY,
      xeroClientId: env.XERO_CLIENT_ID,
      xeroClientSecret: env.XERO_CLIENT_SECRET
    });
    const lines = await fetchContactBankLineSnapshot(token.accessToken);
    const persisted = await saveAccountSnapshot({
      tenantId: body.tenantId,
      source: "xero_full_sync",
      contactBankLines: lines
    });

    return NextResponse.json(
      {
        message: "Snapshot sync completed",
        tenantId: body.tenantId,
        tokenSource: token.source,
        tokenVersion: token.tokenVersion,
        contactBankLinesSynced: persisted.lineCount,
        fetchedAt: persisted.fetchedAt
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Snapshot sync failed", error);
    return NextResponse.json({ message: "Snapshot sync failed" }, { status: 500 });
  }
}
