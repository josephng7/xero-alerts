import { NextResponse } from "next/server";

import { validateAdminInternalRouteAuth } from "@/lib/auth/internal-route-auth";
import { getEnv } from "@/lib/env";
import { pipelineDebug } from "@/lib/server/pipeline-debug";

/**
 * Minimal QStash delivery target for connectivity tests.
 * QStash POSTs here with JSON body; auth uses forwarded `x-internal-api-secret`.
 */
export async function POST(request: Request) {
  const env = getEnv();
  const internalAuth = validateAdminInternalRouteAuth(request, env);
  if (!internalAuth.ok) {
    return internalAuth.response;
  }

  let hasJsonBody = false;
  try {
    const text = await request.text();
    hasJsonBody = text.trim().length > 0;
  } catch {
    hasJsonBody = false;
  }

  pipelineDebug("admin_qstash_smoke_received", { hasJsonBody });
  return NextResponse.json({ ok: true, receivedAt: new Date().toISOString() }, { status: 200 });
}
