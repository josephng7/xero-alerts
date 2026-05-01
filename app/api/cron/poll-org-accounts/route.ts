import { NextResponse } from "next/server";

import { validateInternalRouteAuth } from "@/lib/auth/internal-route-auth";
import { getSnapshotStaleness, saveAccountSnapshot } from "@/lib/db/account-snapshots";
import { getEnv } from "@/lib/env";
import { fetchBankAccountSnapshot } from "@/lib/xero/accounts";
import { getTenantAccessToken } from "@/lib/xero/refresh";

const SNAPSHOT_SOURCE = "xero_poll";

export async function POST(request: Request) {
  const env = getEnv();
  const internalAuth = validateInternalRouteAuth(request, env.INTERNAL_API_SECRET);
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

  let body: { tenantId?: string } = {};
  try {
    body = (await request.json()) as { tenantId?: string };
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.tenantId) {
    return NextResponse.json({ message: "tenantId is required" }, { status: 400 });
  }

  if (env.XERO_ALLOWED_TENANT_ID && env.XERO_ALLOWED_TENANT_ID !== body.tenantId) {
    return NextResponse.json({ message: "tenantId is not permitted" }, { status: 403 });
  }

  try {
    const stalenessBefore = await getSnapshotStaleness({ tenantId: body.tenantId });
    const token = await getTenantAccessToken({
      tenantId: body.tenantId,
      encryptionKey: env.TOKEN_ENCRYPTION_KEY,
      xeroClientId: env.XERO_CLIENT_ID,
      xeroClientSecret: env.XERO_CLIENT_SECRET
    });
    const accounts = await fetchBankAccountSnapshot(token.accessToken);
    const persisted = await saveAccountSnapshot({
      tenantId: body.tenantId,
      source: SNAPSHOT_SOURCE,
      accounts
    });

    return NextResponse.json(
      {
        message: "Org account poll completed",
        tenantId: body.tenantId,
        accountCount: persisted.accountCount,
        fetchedAt: persisted.fetchedAt,
        sourceUsed: {
          snapshot: SNAPSHOT_SOURCE,
          token: token.source
        },
        staleness: {
          beforePoll: stalenessBefore,
          afterPoll: {
            state: "fresh",
            staleAfterSeconds: stalenessBefore.staleAfterSeconds,
            ageSeconds: 0,
            previousFetchedAt: persisted.fetchedAt
          }
        }
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Org account poll failed";
    return NextResponse.json({ message }, { status: 500 });
  }
}
