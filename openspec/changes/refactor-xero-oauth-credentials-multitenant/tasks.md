# Tasks: refactor-xero-oauth-credentials-multitenant

Execute **after live demo** unless a blocker forces earlier. Order is suggested; parallelise where safe.

## Phase A — Specification & schema design

- [ ] Review Xero docs for **`/connections`** shape (tenant vs connection `id`; confirm **refresh applies to all returned tenants** for standard apps).
- [ ] Finalise table names (`xero_oauth_credentials` vs `oauth_credentials`) and whether **`organizations`** stays the tenant anchor or a separate **`xero_tenant_connections`** junction (prefer minimal extra tables).
- [ ] Add Drizzle migration(s): create **`xero_oauth_credentials`**, add **`organizations.credential_id`** nullable + FK.
- [ ] Write **backfill** migration script or SQL: copy from **`xero_oauth_tokens` → credentials**, set **`organizations.credential_id`**.

## Phase B — Data migration & dual-path (optional short window)

- [ ] Backfill production/staging **credential_id** for all orgs; verify counts (**orgs with tokens** = **orgs with credential_id**).
- [ ] (Optional) Ship read-path that prefers **`credential_id`** when set, else legacy join — only if zero-downtime cutover needs it.

## Phase C — Application logic

- [ ] Replace **`fetchPrimaryConnection`** usage in **`/api/oauth/callback`** with **iterate `/connections`**: upsert credential once, upsert each org with **`credential_id`**.
- [ ] Refactor **`saveXeroOauthTokens`** into **`saveXeroOAuthGrant`** (or split helpers): persist credential + N org rows in **one transaction**.
- [ ] Refactor **`lib/xero/refresh.ts`** **`getTenantAccessToken`** to load tokens via **`organization.credential_id`** and CAS-update **`xero_oauth_credentials`** only.
- [ ] Search codebase for **`xero_oauth_tokens`** / **`loadTenantTokenRow`** assumptions; update **sync-snapshots**, **poll-org-accounts**, **process-event** callers if any bypass refresh helper.
- [ ] Update **Vitest** suites (`xero-oauth`, callback, refresh, process-event, workflow) for multi-connection callback + shared credential.

## Phase D — Cleanup & ops

- [ ] Migration: **`NOT NULL`** on **`organizations.credential_id`**; **drop `xero_oauth_tokens`** (and indexes).
- [ ] Update **`docs/runbooks/go-live.md`** (OAuth / multi-org behaviour, reconnect).
- [ ] Append **`docs/operations/logbook.md`** with migration verification notes.
- [ ] Smoke test on staging: connect with **two orgs** selected in Xero → both **`tenantId`s** process webhooks; refresh once → both API calls succeed.

## Phase E — Follow-ups (out of scope unless pulled in)

- [ ] Persist **authorising user** (`id_token` sub / email) on credential or audit table.
- [ ] Admin API to **list connections** per credential for support.
