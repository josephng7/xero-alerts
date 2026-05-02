import { NextResponse } from "next/server";
import { z } from "zod";

import { validateAdminInternalRouteAuth } from "@/lib/auth/internal-route-auth";
import { getAlertById } from "@/lib/db/alerts";
import { getEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

const idSchema = z.string().uuid();

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const env = getEnv();
  const internalAuth = validateAdminInternalRouteAuth(request, env);
  if (!internalAuth.ok) {
    return internalAuth.response;
  }

  const { id: rawId } = await context.params;
  const parsed = idSchema.safeParse(rawId);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid alert id" }, { status: 400 });
  }
  const id = parsed.data;

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
