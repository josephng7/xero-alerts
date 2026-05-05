# Design: Normalized Xero OAuth credentials

## Target data model

```text
xero_oauth_credentials
  id                    uuid PK
  encrypted_access_token text NOT NULL
  encrypted_refresh_token text NOT NULL
  access_token_expires_at timestamptz NOT NULL
  token_version         int NOT NULL DEFAULT 1
  created_at / updated_at

organizations  (existing concept; columns may shift)
  id
  xero_tenant_id        text UNIQUE NOT NULL
  name                  text
  credential_id         uuid NOT NULL FK → xero_oauth_credentials.id
  created_at / updated_at
```

**Removed:** standalone **`xero_oauth_tokens`** table once migration completes (tokens live only on **`xero_oauth_credentials`**).

### Why not duplicate tokens per org?

One OAuth grant yields token pair(s) valid for **each** connection returned by **`/connections`**. Refresh rotates tokens for **the whole grant**; storing identical ciphertext N times risks drift and complicates CAS.

## OAuth callback flow (target)

1. **`exchangeCodeForToken`** → access + refresh + expiry.
2. **`GET /connections`** → array of `{ tenantId, tenantName, … }`.
3. **Upsert one `xero_oauth_credentials` row** with new encrypted tokens (or update existing if reconnect semantics defined).
4. **For each connection:** upsert **`organizations`** by **`xero_tenant_id`**, set **`credential_id`** to that credential row.

**Reconnect:** Policy decision (document in tasks): same Xero user reconnecting might create a **new** credential row vs updating the latest—prefer **update-in-place** on the credential tied to those tenants to avoid orphan rows.

## Refresh flow (`getTenantAccessToken`)

1. Resolve **`organizations`** where **`xero_tenant_id = tenantId`**.
2. Load **`xero_oauth_credentials`** by **`organization.credential_id`**.
3. If access token not near expiry → decrypt and return (same as today).
4. If refresh needed → **`refreshAccessToken`**, then **`UPDATE xero_oauth_credentials`** with **`WHERE id = ? AND token_version = ?`** (CAS). On conflict, retry loop as today.

All code paths that currently join **`organizations` ⋈ `xero_oauth_tokens`** switch to **`organizations` ⋈ `xero_oauth_credentials`**.

## Migration strategy

1. Add **`xero_oauth_credentials`** + **`organizations.credential_id`** (nullable first).
2. Backfill: for each existing **`xero_oauth_tokens`** row, insert credential from org’s tokens, set **`credential_id`** on that org.
3. Dual-read phase optional (short): prefer credential table when present.
4. Make **`credential_id` NOT NULL**, drop **`xero_oauth_tokens`**.

Rollback: keep migration **down** script or restore from backup; avoid destructive drop until soak period ends.

## API / behaviour notes

- **`fetchPrimaryConnection`** is replaced by **full connections list** handling in callback (no `[0]` only).
- Webhooks already carry **`tenantId`**; **`process-event`** unchanged except underlying token resolution.
- **`XERO_ALLOWED_TENANT_ID`**: unchanged — filters **tenant**, not credential shape.

## Risks

- **Partial failures** mid-callback (some orgs upserted, credential write fails): use a **transaction** wrapping credential insert + org upserts where Drizzle/Postgres allows.
- **Advisor-scale** many tenants: index **`organizations(xero_tenant_id)`** (already unique), **`organizations(credential_id)`** for ops queries.
