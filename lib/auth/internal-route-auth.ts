import { timingSafeEqual } from "node:crypto";

import type { Env } from "@/lib/env";
import { NextResponse } from "next/server";

type InternalRouteAuthResult =
  | { ok: true }
  | { ok: false; response: NextResponse<{ message: string }> };

function safeCompareSecret(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualBuffer, expectedBuffer);
}

export type InternalSecretBundle = {
  /** Primary secret for this route class */
  current: string | undefined;
  /** Optional previous secret during rotation overlap */
  previous?: string | undefined;
  /** Primary env key name (for logs only) */
  envKey: string;
};

/**
 * Validates `x-internal-api-secret` against the configured bundle (current and optional previous).
 * Split cron vs admin secrets limit blast radius if one caller class is compromised.
 */
export function validateInternalRouteAuth(request: Request, bundle: InternalSecretBundle): InternalRouteAuthResult {
  if (!bundle.current) {
    console.error(`${bundle.envKey} is not configured`);
    return {
      ok: false,
      response: NextResponse.json({ message: "Internal authentication is not configured" }, { status: 500 })
    };
  }

  const providedSecret = request.headers.get("x-internal-api-secret");
  if (!providedSecret) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Unauthorized internal request" }, { status: 401 })
    };
  }

  const matchesCurrent = safeCompareSecret(providedSecret, bundle.current);
  const matchesPrevious =
    bundle.previous && bundle.previous.length > 0 ? safeCompareSecret(providedSecret, bundle.previous) : false;

  if (!matchesCurrent && !matchesPrevious) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Forbidden internal request" }, { status: 403 })
    };
  }

  return { ok: true };
}

export function validateCronInternalRouteAuth(request: Request, env: Env): InternalRouteAuthResult {
  return validateInternalRouteAuth(request, {
    current: env.INTERNAL_CRON_SECRET,
    previous: env.INTERNAL_CRON_SECRET_PREVIOUS,
    envKey: "INTERNAL_CRON_SECRET"
  });
}

export function validateAdminInternalRouteAuth(request: Request, env: Env): InternalRouteAuthResult {
  return validateInternalRouteAuth(request, {
    current: env.INTERNAL_ADMIN_SECRET,
    previous: env.INTERNAL_ADMIN_SECRET_PREVIOUS,
    envKey: "INTERNAL_ADMIN_SECRET"
  });
}
