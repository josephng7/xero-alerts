import { timingSafeEqual } from "node:crypto";

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

export function validateInternalRouteAuth(
  request: Request,
  internalApiSecret: string | undefined
): InternalRouteAuthResult {
  if (!internalApiSecret) {
    console.error("INTERNAL_API_SECRET is not configured");
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

  if (!safeCompareSecret(providedSecret, internalApiSecret)) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Forbidden internal request" }, { status: 403 })
    };
  }

  return { ok: true };
}
