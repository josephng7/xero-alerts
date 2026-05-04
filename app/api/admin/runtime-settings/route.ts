import { NextResponse } from "next/server";
import { z } from "zod";

import { validateAdminInternalRouteAuth } from "@/lib/auth/internal-route-auth";
import { getPipelineDebugRow, setPipelineDebugEnabled } from "@/lib/db/app-runtime-settings";
import { getEnv } from "@/lib/env";

const patchBodySchema = z
  .object({
    pipelineDebug: z.boolean()
  })
  .strict();

/**
 * Read / update operator runtime flags (singleton row). Requires `x-internal-api-secret`.
 */
export async function GET(request: Request) {
  const env = getEnv();
  const internalAuth = validateAdminInternalRouteAuth(request, env);
  if (!internalAuth.ok) {
    return internalAuth.response;
  }
  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json({ message: "DATABASE_URL is not configured" }, { status: 503 });
  }
  try {
    const row = await getPipelineDebugRow();
    if (!row) {
      return NextResponse.json(
        { message: "Runtime settings row missing; run migrations (`pnpm run db:migrate`)" },
        { status: 503 }
      );
    }
    return NextResponse.json(
      {
        pipelineDebug: row.pipelineDebug,
        updatedAt: row.updatedAt.toISOString(),
        envOverride: process.env.PIPELINE_DEBUG === "1"
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ message: "Failed to load runtime settings" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const env = getEnv();
  const internalAuth = validateAdminInternalRouteAuth(request, env);
  if (!internalAuth.ok) {
    return internalAuth.response;
  }

  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json({ message: "DATABASE_URL is not configured" }, { status: 503 });
  }

  const contentType = request.headers.get("content-type");
  if (!contentType?.toLowerCase().includes("application/json")) {
    return NextResponse.json({ message: "Content-Type must be application/json" }, { status: 415 });
  }

  let body: z.infer<typeof patchBodySchema>;
  try {
    body = patchBodySchema.parse(await request.json());
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid request body", issues: e.issues }, { status: 400 });
    }
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  try {
    await setPipelineDebugEnabled(body.pipelineDebug);
    const row = await getPipelineDebugRow();
    return NextResponse.json(
      {
        pipelineDebug: row?.pipelineDebug ?? body.pipelineDebug,
        updatedAt: row?.updatedAt.toISOString() ?? new Date().toISOString(),
        message: "Runtime settings updated"
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ message: "Failed to update runtime settings" }, { status: 500 });
  }
}
