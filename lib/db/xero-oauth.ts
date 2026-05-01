import { eq } from "drizzle-orm";

import { getDb, organizations, xeroOauthTokens } from "@/lib/db/index";
import { encryptToken } from "@/lib/crypto";

type SaveOauthTokensInput = {
  tenantId: string;
  tenantName: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  encryptionKey: string;
};

export async function saveXeroOauthTokens(input: SaveOauthTokensInput) {
  const db = getDb();
  const encryptedAccessToken = encryptToken(input.accessToken, input.encryptionKey);
  const encryptedRefreshToken = encryptToken(input.refreshToken, input.encryptionKey);

  await db
    .insert(organizations)
    .values({
      xeroTenantId: input.tenantId,
      name: input.tenantName
    })
    .onConflictDoUpdate({
      target: organizations.xeroTenantId,
      set: {
        name: input.tenantName,
        updatedAt: new Date()
      }
    });

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.xeroTenantId, input.tenantId)
  });

  if (!org) {
    throw new Error("Failed to upsert Xero organization");
  }

  await db
    .insert(xeroOauthTokens)
    .values({
      organizationId: org.id,
      encryptedAccessToken,
      encryptedRefreshToken,
      accessTokenExpiresAt: input.expiresAt,
      tokenVersion: 1
    })
    .onConflictDoUpdate({
      target: xeroOauthTokens.organizationId,
      set: {
        encryptedAccessToken,
        encryptedRefreshToken,
        accessTokenExpiresAt: input.expiresAt,
        tokenVersion: 1,
        updatedAt: new Date()
      }
    });
}
