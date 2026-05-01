import { randomBytes } from "node:crypto";

const XERO_AUTHORIZE_URL = "https://login.xero.com/identity/connect/authorize";
const XERO_TOKEN_URL = "https://identity.xero.com/connect/token";
const XERO_CONNECTIONS_URL = "https://api.xero.com/connections";

export type XeroTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
};

export type XeroConnection = {
  tenantId: string;
  tenantName: string;
};

function parseTokenResponse(payload: Partial<XeroTokenResponse>) {
  if (!payload.access_token || !payload.refresh_token || !payload.expires_in) {
    throw new Error("Xero token response missing required fields");
  }

  return {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
    expires_in: payload.expires_in,
    token_type: payload.token_type ?? "Bearer",
    scope: payload.scope
  };
}

export function createOauthState() {
  return randomBytes(24).toString("base64url");
}

export function buildXeroAuthorizeUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
  scope?: string;
}) {
  const searchParams = new URLSearchParams({
    response_type: "code",
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    scope: params.scope ?? "openid profile email accounting.transactions offline_access",
    state: params.state
  });
  return `${XERO_AUTHORIZE_URL}?${searchParams.toString()}`;
}

export async function exchangeCodeForToken(params: {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  code: string;
}): Promise<XeroTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: params.redirectUri
  });
  const basic = Buffer.from(`${params.clientId}:${params.clientSecret}`).toString("base64");

  const response = await fetch(XERO_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Xero token exchange failed (${response.status}): ${text}`);
  }

  return parseTokenResponse((await response.json()) as Partial<XeroTokenResponse>);
}

export async function refreshAccessToken(params: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<XeroTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: params.refreshToken
  });
  const basic = Buffer.from(`${params.clientId}:${params.clientSecret}`).toString("base64");

  const response = await fetch(XERO_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Xero token refresh failed (${response.status}): ${text}`);
  }

  return parseTokenResponse((await response.json()) as Partial<XeroTokenResponse>);
}

export async function fetchPrimaryConnection(accessToken: string): Promise<XeroConnection> {
  const response = await fetch(XERO_CONNECTIONS_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Xero connections lookup failed (${response.status}): ${text}`);
  }

  const payload = (await response.json()) as Array<{
    tenantId?: string;
    tenantName?: string;
  }>;
  const primary = payload[0];

  if (!primary?.tenantId) {
    throw new Error("No Xero tenant connection found for authorized account");
  }

  return {
    tenantId: primary.tenantId,
    tenantName: primary.tenantName ?? "Xero Organization"
  };
}
