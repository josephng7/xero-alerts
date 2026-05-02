import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { saveXeroOauthTokens } from "@/lib/db/xero-oauth";
import { getEnv } from "@/lib/env";
import { getAppBaseUrl } from "@/lib/server/app-base-url";
import { exchangeCodeForToken, fetchPrimaryConnection } from "@/lib/xero/oauth";

const STATE_PATTERN = /^[A-Za-z0-9_-]{20,128}$/;

export async function GET(request: Request) {
  const env = getEnv();
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.json({ message: "Missing code/state query parameters" }, { status: 400 });
  }
  if (code.length > 2048 || !STATE_PATTERN.test(state)) {
    return NextResponse.json({ message: "Invalid OAuth callback parameters" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("xero_oauth_state")?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.json({ message: "Invalid OAuth state" }, { status: 400 });
  }

  if (!env.XERO_CLIENT_ID || !env.XERO_CLIENT_SECRET) {
    return NextResponse.json(
      {
        message: "Missing required environment variables: XERO_CLIENT_ID, XERO_CLIENT_SECRET"
      },
      { status: 500 }
    );
  }

  if (!env.TOKEN_ENCRYPTION_KEY) {
    return NextResponse.json({ message: "TOKEN_ENCRYPTION_KEY is not configured" }, { status: 500 });
  }

  try {
    const redirectUri = new URL("/api/oauth/callback", getAppBaseUrl()).toString();
    const token = await exchangeCodeForToken({
      clientId: env.XERO_CLIENT_ID,
      clientSecret: env.XERO_CLIENT_SECRET,
      redirectUri,
      code
    });
    const connection = await fetchPrimaryConnection(token.access_token);
    const expiresAt = new Date(Date.now() + token.expires_in * 1000);

    await saveXeroOauthTokens({
      tenantId: connection.tenantId,
      tenantName: connection.tenantName,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt,
      encryptionKey: env.TOKEN_ENCRYPTION_KEY
    });

    cookieStore.set("xero_oauth_state", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      path: "/",
      maxAge: 0
    });

    return NextResponse.json(
      {
        message: "Xero OAuth connected",
        tenantId: connection.tenantId,
        tenantName: connection.tenantName
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("OAuth callback failed", error);
    return NextResponse.json({ message: "OAuth callback failed" }, { status: 500 });
  }
}
