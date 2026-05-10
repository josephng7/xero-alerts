import { eq } from "drizzle-orm";

import { encryptToken } from "@/lib/crypto";
import { getDb, organizations, xeroOauthCredentials } from "@/lib/db/index";
import type { XeroConnection } from "@/lib/xero/oauth";

type SaveOAuthGrantInput = {
  connections: XeroConnection[];
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  encryptionKey: string;
};

/**
 * Persists a Xero OAuth grant and all tenant connections that came with it.
 *
 * Strategy (reconnect-in-place):
 *   1. Look up whether any of the supplied tenantIds already has a credential_id.
 *   2. If so, update that credential row in-place (token rotation).
 *   3. Otherwise insert a new credential row.
 *   4. For every connection, upsert the organizations row and set credential_id.
 *
 * All writes execute inside one transaction so a partial failure leaves the DB
 * in the pre-grant state.
 */
export async function saveXeroOAuthGrant(input: SaveOAuthGrantInput): Promise<void> {
  const db = getDb();
  const encryptedAccessToken = encryptToken(input.accessToken, input.encryptionKey);
  const encryptedRefreshToken = encryptToken(input.refreshToken, input.encryptionKey);
  const tenantIds = input.connections.map((c) => c.tenantId);

  await db.transaction(async (tx) => {
    // Resolve existing credential_id for any tenant in this grant (reconnect case).
    let credentialId: string | null = null;
    for (const tid of tenantIds) {
      const row = await tx.query.organizations.findFirst({
        where: eq(organizations.xeroTenantId, tid),
        columns: { credentialId: true }
      });
      if (row?.credentialId) {
        credentialId = row.credentialId;
        break;
      }
    }

    if (credentialId) {
      // Update existing credential in-place; reset token_version to increment from 1.
      await tx
        .update(xeroOauthCredentials)
        .set({
          encryptedAccessToken,
          encryptedRefreshToken,
          accessTokenExpiresAt: input.expiresAt,
          tokenVersion: 1,
          updatedAt: new Date()
        })
        .where(eq(xeroOauthCredentials.id, credentialId));
    } else {
      // New grant — insert a fresh credential row and capture its id.
      const [inserted] = await tx
        .insert(xeroOauthCredentials)
        .values({
          encryptedAccessToken,
          encryptedRefreshToken,
          accessTokenExpiresAt: input.expiresAt,
          tokenVersion: 1
        })
        .returning({ id: xeroOauthCredentials.id });
      if (!inserted) {
        throw new Error("Failed to insert Xero OAuth credential");
      }
      credentialId = inserted.id;
    }

    // Upsert each organization and link it to this credential.
    for (const conn of input.connections) {
      await tx
        .insert(organizations)
        .values({
          xeroTenantId: conn.tenantId,
          name: conn.tenantName,
          credentialId
        })
        .onConflictDoUpdate({
          target: organizations.xeroTenantId,
          set: {
            name: conn.tenantName,
            credentialId,
            updatedAt: new Date()
          }
        });
    }
  });
}
