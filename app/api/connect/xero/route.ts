import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getEnv } from "@/lib/env";
import { getAppBaseUrl } from "@/lib/server/app-base-url";
import { buildXeroAuthorizeUrl, createOauthState } from "@/lib/xero/oauth";

export async function GET() {
  const env = getEnv();
  if (!env.XERO_CLIENT_ID) {
    return NextResponse.json(
      { message: "Missing required environment variable: XERO_CLIENT_ID" },
      { status: 500 }
    );
  }

  const state = createOauthState();
  const redirectUri = new URL("/api/oauth/callback", getAppBaseUrl()).toString();
  const authorizeUrl = buildXeroAuthorizeUrl({
    clientId: env.XERO_CLIENT_ID,
    redirectUri,
    state,
    scope: env.XERO_OAUTH_SCOPES
  });

  const cookieStore = await cookies();
  cookieStore.set("xero_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10
  });

  return NextResponse.redirect(authorizeUrl, { status: 302 });
}
