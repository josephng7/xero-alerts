import { NextResponse } from "next/server";

import { validateAdminInternalRouteAuth } from "@/lib/auth/internal-route-auth";
import { getEnv } from "@/lib/env";
import { notifyPayloadSchema, runNotifyJob } from "@/lib/jobs/notify";

export async function POST(request: Request) {
  const env = getEnv();
  const internalAuth = validateAdminInternalRouteAuth(request, env);
  if (!internalAuth.ok) {
    return internalAuth.response;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = notifyPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid notify payload",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      },
      { status: 400 }
    );
  }

  const result = await runNotifyJob(parsed.data, env);
  return NextResponse.json(result, { status: 200 });
}
