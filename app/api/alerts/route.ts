import { NextResponse } from "next/server";

import { validateAdminInternalRouteAuth } from "@/lib/auth/internal-route-auth";
import { listAlerts } from "@/lib/db/alerts";
import { getEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const env = getEnv();
  const internalAuth = validateAdminInternalRouteAuth(request, env);
  if (!internalAuth.ok) {
    return internalAuth.response;
  }

  const url = new URL(request.url);
  const tenantQuery = url.searchParams.get("tenantId")?.trim() ?? "";
  const tenantId = tenantQuery.length > 0 ? tenantQuery : undefined;

  if (env.XERO_ALLOWED_TENANT_ID) {
    if (tenantId && tenantId !== env.XERO_ALLOWED_TENANT_ID) {
      return NextResponse.json({ message: "tenantId is not permitted" }, { status: 403 });
    }
  }

  const rawLimit = url.searchParams.get("limit");
  let limit = 50;
  if (rawLimit) {
    const parsed = Number.parseInt(rawLimit, 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return NextResponse.json({ message: "Invalid limit" }, { status: 400 });
    }
    limit = Math.min(parsed, 100);
  }

  const cursor = url.searchParams.get("cursor")?.trim() || undefined;

  try {
    const { items, nextCursor } = await listAlerts({
      tenantId,
      allowedTenantId: env.XERO_ALLOWED_TENANT_ID ?? null,
      limit,
      cursor: cursor ?? null
    });

    return NextResponse.json(
      {
        items,
        nextCursor
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/alerts failed", error);
    return NextResponse.json({ message: "Failed to list alerts" }, { status: 500 });
  }
}
