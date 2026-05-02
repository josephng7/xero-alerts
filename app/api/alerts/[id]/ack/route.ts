import { NextResponse } from "next/server";
import { z } from "zod";

import { validateAdminInternalRouteAuth } from "@/lib/auth/internal-route-auth";
import { acknowledgeAlert, getAlertById } from "@/lib/db/alerts";
import { getEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

const idSchema = z.string().uuid();

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
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
    const existing = await getAlertById(id);
    if (!existing) {
      return NextResponse.json({ message: "Alert not found" }, { status: 404 });
    }

    if (env.XERO_ALLOWED_TENANT_ID && existing.xeroTenantId !== env.XERO_ALLOWED_TENANT_ID) {
      return NextResponse.json({ message: "Alert not found" }, { status: 404 });
    }

    if (existing.acknowledgedAt) {
      return NextResponse.json(
        {
          message: "Alert already acknowledged",
          acknowledgedAt: existing.acknowledgedAt
        },
        { status: 200 }
      );
    }

    await acknowledgeAlert(id);
    const updated = await getAlertById(id);
    return NextResponse.json(
      {
        message: "Alert acknowledged",
        acknowledgedAt: updated?.acknowledgedAt ?? null
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/alerts/[id]/ack failed", error);
    return NextResponse.json({ message: "Acknowledgement failed" }, { status: 500 });
  }
}
