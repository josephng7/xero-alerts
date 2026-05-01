import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getEnv } from "@/lib/env";
import { buildXeroAuthorizeUrl, createOauthState } from "@/lib/xero/oauth";

export async function GET() {
  const env = getEnv();
  if (!env.XERO_CLIENT_ID || !env.NEXTAUTH_URL) {
    return NextResponse.json(
      {
        message: "Missing required environment variables: XERO_CLIENT_ID and NEXTAUTH_URL"
      },
      { status: 500 }
    );
  }

  const state = createOauthState();
  const redirectUri = new URL("/api/oauth/callback", env.NEXTAUTH_URL).toString();
  const authorizeUrl = buildXeroAuthorizeUrl({
    clientId: env.XERO_CLIENT_ID,
    redirectUri,
    state
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
