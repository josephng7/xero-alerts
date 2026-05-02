import { NextResponse } from "next/server";

import { validateAdminInternalRouteAuth } from "@/lib/auth/internal-route-auth";
import { getAlertById } from "@/lib/db/alerts";
import { getEnv } from "@/lib/env";
import { parseAlertId } from "@/lib/server/alert-id";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const env = getEnv();
  const internalAuth = validateAdminInternalRouteAuth(request, env);
  if (!internalAuth.ok) {
    return internalAuth.response;
  }

  const { id: rawId } = await context.params;
  const id = parseAlertId(rawId);
  if (!id) {
    return NextResponse.json({ message: "Invalid alert id" }, { status: 400 });
  }

  try {
    const alert = await getAlertById(id);
    if (!alert) {
      return NextResponse.json({ message: "Alert not found" }, { status: 404 });
    }

    if (env.XERO_ALLOWED_TENANT_ID && alert.xeroTenantId !== env.XERO_ALLOWED_TENANT_ID) {
      return NextResponse.json({ message: "Alert not found" }, { status: 404 });
    }

    return NextResponse.json({ alert }, { status: 200 });
  } catch (error) {
    console.error("GET /api/alerts/[id] failed", error);
    return NextResponse.json({ message: "Failed to load alert" }, { status: 500 });
  }
}
