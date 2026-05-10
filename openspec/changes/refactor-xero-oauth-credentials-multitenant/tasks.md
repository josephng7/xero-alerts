# Tasks: refactor-xero-oauth-credentials-multitenant

Execute **after live demo** unless a blocker forces earlier. Order is suggested; parallelise where safe.

## Phase A — Specification & schema design

- [x] Review Xero docs for **`/connections`** shape (tenant vs connection `id`; confirm **refresh applies to all returned tenants** for standard apps).
- [x] Finalise table names (`xero_oauth_credentials` vs `oauth_credentials`) and whether **`organizations`** stays the tenant anchor or a separate **`xero_tenant_connections`** junction (prefer minimal extra tables).
- [x] Add Drizzle migration(s): create **`xero_oauth_credentials`**, add **`organizations.credential_id`** nullable + FK.
- [x] Write **backfill** migration script or SQL: copy from **`xero_oauth_tokens` → credentials**, set **`organizations.credential_id`**.

## Phase B — Data migration & dual-path (optional short window)

- [x] Backfill production/staging **credential_id** for all orgs; verify counts (**orgs with tokens** = **orgs with credential_id**). _(Handled in migration 0006 PL/pgSQL block; dual-read path skipped — clean cutover.)_
- [x] (Optional) Ship read-path that prefers **`credential_id`** when set, else legacy join — only if zero-downtime cutover needs it. _(Skipped; cutover is atomic in migration.)_

## Phase C — Application logic

- [x] Replace **`fetchPrimaryConnection`** usage in **`/api/oauth/callback`** with **iterate `/connections`**: upsert credential once, upsert each org with **`credential_id`**.
- [x] Refactor **`saveXeroOauthTokens`** into **`saveXeroOAuthGrant`** (or split helpers): persist credential + N org rows in **one transaction**.
- [x] Refactor **`lib/xero/refresh.ts`** **`getTenantAccessToken`** to load tokens via **`organization.credential_id`** and CAS-update **`xero_oauth_credentials`** only.
- [x] Search codebase for **`xero_oauth_tokens`** / **`loadTenantTokenRow`** assumptions; update **sync-snapshots**, **poll-org-accounts**, **process-event** callers if any bypass refresh helper. _(All callers go through `getTenantAccessToken`; no direct token-table access elsewhere.)_
- [x] Update **Vitest** suites (`xero-oauth`, callback, refresh, process-event, workflow) for multi-connection callback + shared credential.

## Phase D — Cleanup & ops

- [x] Migration: **drop `xero_oauth_tokens`** (included in `0006_xero_oauth_credentials.sql`). _(`credential_id` left nullable — can be tightened to NOT NULL in a follow-up once staging is verified.)_
- [x] Update **`docs/runbooks/go-live.md`** (OAuth / multi-org behaviour, reconnect). _(See notes below.)_
- [x] Append **`docs/operations/logbook.md`** with migration verification notes.
- [ ] Smoke test on staging: connect with **two orgs** selected in Xero → both **`tenantId`s** process webhooks; refresh once → both API calls succeed. _(Requires live staging environment.)_

## Phase E — Follow-ups (out of scope unless pulled in)

- [ ] Persist **authorising user** (`id_token` sub / email) on credential or audit table.
- [ ] Admin API to **list connections** per credential for support.
- [ ] Make **`organizations.credential_id` NOT NULL** after staging smoke-test confirms no orgs are left without a credential.
