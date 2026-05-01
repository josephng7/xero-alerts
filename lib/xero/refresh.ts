import { and, eq } from "drizzle-orm";

import { decryptToken, encryptToken } from "@/lib/crypto";
import { getDb, organizations, xeroOauthTokens } from "@/lib/db/index";
import { refreshAccessToken } from "@/lib/xero/oauth";

const EXPIRY_SKEW_MS = 2 * 60 * 1000;
const MAX_RETRY_ATTEMPTS = 2;

export type TenantAccessToken = {
  tenantId: string;
  tenantName: string | null;
  accessToken: string;
  expiresAt: Date;
  source: "cached" | "refreshed";
  tokenVersion: number;
};

function shouldRefresh(expiresAt: Date) {
  return expiresAt.getTime() - Date.now() <= EXPIRY_SKEW_MS;
}

async function loadTenantTokenRow(tenantId: string) {
  const db = getDb();
  const rows = await db
    .select({
      tenantId: organizations.xeroTenantId,
      tenantName: organizations.name,
      organizationId: organizations.id,
      encryptedAccessToken: xeroOauthTokens.encryptedAccessToken,
      encryptedRefreshToken: xeroOauthTokens.encryptedRefreshToken,
      accessTokenExpiresAt: xeroOauthTokens.accessTokenExpiresAt,
      tokenVersion: xeroOauthTokens.tokenVersion
    })
    .from(organizations)
    .innerJoin(xeroOauthTokens, eq(xeroOauthTokens.organizationId, organizations.id))
    .where(eq(organizations.xeroTenantId, tenantId))
    .limit(1);

  return rows[0] ?? null;
}

export async function getTenantAccessToken(params: {
  tenantId: string;
  encryptionKey: string;
  xeroClientId: string;
  xeroClientSecret: string;
}): Promise<TenantAccessToken> {
  for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt += 1) {
    const row = await loadTenantTokenRow(params.tenantId);
    if (!row) {
      throw new Error(`No token record found for tenant ${params.tenantId}`);
    }

    const accessToken = decryptToken(row.encryptedAccessToken, params.encryptionKey);

    if (!shouldRefresh(row.accessTokenExpiresAt)) {
      return {
        tenantId: row.tenantId,
        tenantName: row.tenantName,
        accessToken,
        expiresAt: row.accessTokenExpiresAt,
        source: "cached",
        tokenVersion: row.tokenVersion
      };
    }

    const refreshToken = decryptToken(row.encryptedRefreshToken, params.encryptionKey);
    const refreshed = await refreshAccessToken({
      clientId: params.xeroClientId,
      clientSecret: params.xeroClientSecret,
      refreshToken
    });
    const nextExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000);

    const db = getDb();
    const updateResult = await db
      .update(xeroOauthTokens)
      .set({
        encryptedAccessToken: encryptToken(refreshed.access_token, params.encryptionKey),
        encryptedRefreshToken: encryptToken(refreshed.refresh_token, params.encryptionKey),
        accessTokenExpiresAt: nextExpiresAt,
        tokenVersion: row.tokenVersion + 1,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(xeroOauthTokens.organizationId, row.organizationId),
          eq(xeroOauthTokens.tokenVersion, row.tokenVersion)
        )
      )
      .returning({
        tokenVersion: xeroOauthTokens.tokenVersion
      });

    if (updateResult.length > 0) {
      return {
        tenantId: row.tenantId,
        tenantName: row.tenantName,
        accessToken: refreshed.access_token,
        expiresAt: nextExpiresAt,
        source: "refreshed",
        tokenVersion: updateResult[0].tokenVersion
      };
    }
  }

  throw new Error("Token refresh conflicted with a concurrent update; retry request");
}
