# Go-live checklist

Use this checklist when deploying the app to a new environment or cutting over production traffic.

## How environment validation works

- Variables in `lib/env.ts` are **optional at startup** unless you provide a value: the process can boot with only the keys needed for the features you use.
- **Empty or whitespace-only** values in the host (for example Vercel environment UI) are normalized to **unset**, so optional integrations do not fail URL or email validation.
- If you **do** set a key, the value must be valid for its type (real URL, email, non-empty string). Prefer **deleting** unused keys in the dashboard instead of placeholder strings.
- Individual routes still enforce their own requirements (database, Xero, internal secrets). See **What to set, by goal** below.

## Vercel notes

- **`VERCEL_URL`** is injected automatically in preview and production.
- **`NEXTAUTH_URL`** is optional: set your canonical `https://…` origin when it must differ from `https://${VERCEL_URL}` (for example a custom domain while `VERCEL_URL` remains the `*.vercel.app` hostname).
- Public base URL resolution for OAuth redirects and QStash targets is documented in `lib/server/app-base-url.ts`: `NEXTAUTH_URL` (after trimming a trailing slash) → `https://${VERCEL_URL}` → `http://localhost:3000`.

## What to set, by goal

### Green health check (`GET /api/health`)

| Variable         | Notes                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| `DATABASE_URL`   | **Required** for HTTP 200. The handler calls `getDb()`; if unset, Postgres throws and the route returns **503** with `db unavailable`. |

### Xero OAuth (`/api/connect/xero` → `/api/oauth/callback`)

| Variable               | Notes                                                                       |
| ---------------------- | --------------------------------------------------------------------------- |
| `XERO_CLIENT_ID`       | **Required** for connect and callback.                                      |
| `XERO_CLIENT_SECRET`   | **Required** for callback token exchange.                                   |
| `TOKEN_ENCRYPTION_KEY` | **Required** for callback — tokens are encrypted before persistence.       |
| `DATABASE_URL`         | **Required** — OAuth tokens are stored in Postgres.                         |
| `XERO_OAUTH_SCOPES`    | Optional. Space-separated scopes. Default: `openid profile email accounting.contacts.read offline_access` (read-only Contacts + refresh). **Must match** the scopes enabled for this client in the [Xero Developer](https://developer.xero.com/) app. If Xero shows `unauthorized_client` / **Invalid scope for client**, open the app → **OAuth 2.0** scopes and enable every scope in the default string (or set `XERO_OAUTH_SCOPES` to match exactly what is enabled). |

**Troubleshooting — “Invalid scope for client” on the Xero error page:** The authorization URL’s `scope` list and the app’s configured scopes must align. The app only **reads** contact bank details via `GET /Contacts` and needs **`accounting.contacts.read`** (read-only) or the legacy write scope **`accounting.contacts`**. After changing scopes in the Xero portal, save the app and try **Connect to Xero** again. Reconnect is required for existing tokens to receive the new scopes.

### Webhooks (`POST /api/webhooks/xero`)

| Variable                 | Notes                                                                                         |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| `XERO_WEBHOOK_KEY`       | **Required** — verifies `x-xero-signature`.                                                 |
| `DATABASE_URL`           | **Required** — persists webhook events.                                                      |
| `QSTASH_TOKEN`           | Optional. If unset, the event is stored but **not** queued (response still 202).             |
| `INTERNAL_ADMIN_SECRET`  | **Required when `QSTASH_TOKEN` is set** — publish uses `Upstash-Forward-x-internal-api-secret` so QStash deliveries authenticate to `process-event`. |
| `QSTASH_URL`             | Optional. Defaults to `https://qstash.upstash.io` when `QSTASH_TOKEN` is set (`lib/queue/qstash`). |

### Worker (`POST /api/jobs/process-event`)

| Variable                                                         | Notes                                                    |
| ---------------------------------------------------------------- | -------------------------------------------------------- |
| `INTERNAL_ADMIN_SECRET`                                          | **Required** — `validateAdminInternalRouteAuth` / `x-internal-api-secret`. |
| `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`, `TOKEN_ENCRYPTION_KEY` | **Required** — same checks as OAuth worker paths.        |
| `DATABASE_URL`                                                 | **Required**.                                           |

Optional: `XERO_ALLOWED_TENANT_ID` rejects events for other tenants.

### Cron (`POST /api/cron/poll-org-accounts`)

| Variable               | Notes                                      |
| ---------------------- | ------------------------------------------ |
| `INTERNAL_CRON_SECRET` | **Required** for cron-style authentication. |
| Plus DB, Xero, and encryption | As enforced by the route handler (same family as other jobs). |

### Alerts UI (dashboard / detail pages)

| Variable                | Notes                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------- |
| `INTERNAL_ADMIN_SECRET` | **Required** for list/detail data — server code calls `/api/alerts` with this secret. Without it, the UI treats data as unavailable. |

### Notifications (`POST /api/jobs/notify`)

| Variable                                                           | Notes                                  |
| ------------------------------------------------------------------ | -------------------------------------- |
| `INTERNAL_ADMIN_SECRET`                                            | **Required**.                          |
| `TEAMS_WEBHOOK_URL`                                                | Set if using Teams.                    |
| `RESEND_API_KEY`, `ALERTS_FROM_EMAIL`, `ALERTS_TO_EMAIL`           | Set if using email (sender must be allowed in Resend). |

---

## Full variable reference

Canonical list: `lib/env.ts` and `.env.example`. Values below marked “schema only” are accepted at startup but **not read by route code yet**.

### Database

| Variable       | Purpose                                                |
| -------------- | ------------------------------------------------------ |
| `DATABASE_URL` | Postgres connection URI (for example Supabase pooler). |

### Xero

| Variable                | Purpose                                                                          |
| ----------------------- | -------------------------------------------------------------------------------- |
| `XERO_CLIENT_ID`        | OAuth client ID from the Xero developer app.                                       |
| `XERO_CLIENT_SECRET`    | OAuth client secret.                                                             |
| `XERO_WEBHOOK_KEY`      | Webhook signing key (must match Xero portal config for `x-xero-signature`).       |
| `XERO_ALLOWED_TENANT_ID` | Optional single-tenant guard when set.                                          |

### App URLs and session

| Variable          | Purpose                                                                 |
| ----------------- | ----------------------------------------------------------------------- |
| `NEXTAUTH_URL`    | Optional canonical HTTPS origin override (see Vercel notes above).       |
| `NEXTAUTH_SECRET` | Schema only today — NextAuth is not wired; optional for future auth.   |

### Token storage

| Variable               | Purpose                                  |
| ---------------------- | ---------------------------------------- |
| `TOKEN_ENCRYPTION_KEY` | Encrypts OAuth tokens at rest (AES-GCM). |

### Internal API authentication

Worker, admin, and cron routes use **`x-internal-api-secret`** with split secrets:

| Variable                         | Purpose                                                                 |
| -------------------------------- | ----------------------------------------------------------------------- |
| `INTERNAL_ADMIN_SECRET`          | `POST /api/jobs/process-event`, `POST /api/jobs/notify`, admin routes, alerts API usage from UI. |
| `INTERNAL_CRON_SECRET`           | `POST /api/cron/poll-org-accounts`.                                     |
| `INTERNAL_ADMIN_SECRET_PREVIOUS` | Optional overlap during rotation.                                       |
| `INTERNAL_CRON_SECRET_PREVIOUS`  | Optional overlap during rotation.                                       |

See `docs/runbooks/internal-api-secret-rotation.md`.

### Redis / KV

| Variable             | Purpose                                       |
| -------------------- | --------------------------------------------- |
| `KV_REST_API_URL`    | Schema only — **not referenced by app code yet**. |
| `KV_REST_API_TOKEN`  | Schema only — safe to omit.                   |

### Queue (QStash)

| Variable                     | Purpose                                                                 |
| ---------------------------- | ----------------------------------------------------------------------- |
| `QSTASH_TOKEN`               | Bearer token for publishing to Upstash (enables webhook→worker handoff). |
| `QSTASH_URL`                 | Optional API origin; defaults when unset (see `DEFAULT_QSTASH_URL`).     |
| `QSTASH_CURRENT_SIGNING_KEY` | Schema only — **not used by routes for verification today**.             |
| `QSTASH_NEXT_SIGNING_KEY`    | Schema only — reserved for future receiver verification.                |
| `PIPELINE_DEBUG`             | Optional **override**: **`1`** forces **`[pipeline]`** logs even when the DB flag is off. Primary control is **`app_runtime_settings.pipeline_debug`** (see step 7). |

### Notifications

| Variable             | Purpose                    |
| -------------------- | -------------------------- |
| `TEAMS_WEBHOOK_URL`  | Microsoft Teams incoming webhook. |
| `RESEND_API_KEY`     | Resend API key.            |
| `ALERTS_FROM_EMAIL`  | Sender (verified in Resend). |
| `ALERTS_TO_EMAIL`    | Alert recipient.           |

### Observability

| Variable      | Purpose                                                                 |
| ------------- | ----------------------------------------------------------------------- |
| `SENTRY_DSN`  | Parsed at startup. **Sentry SDK is not wired in this repository yet** — setting `SENTRY_DSN` alone does not send events until instrumentation exists. |

---

## Order of operations

1. **Database**: Create or select Postgres. Set **`DATABASE_URL`**.
2. **Migrations**: From a trusted machine with env loaded, run `pnpm run db:migrate` so schema matches `drizzle/` migrations.
3. **Secrets**: Set **`TOKEN_ENCRYPTION_KEY`**, **`INTERNAL_ADMIN_SECRET`**, **`INTERNAL_CRON_SECRET`**, Xero client IDs/secrets, **`XERO_WEBHOOK_KEY`**, and notification/queue vars per the goals above.
4. **Deploy**: Deploy the application. Set **`NEXTAUTH_URL`** only when the public origin must differ from **`VERCEL_URL`**.
5. **OAuth connect**: Complete Xero OAuth once per environment (`/api/connect/xero` then callback). Confirm tenant data in the database if you inspect rows.
6. **Webhook URL**: In the Xero developer portal, set the webhook URL to:

   `https://<your-host>/api/webhooks/xero`

   Use the same **`XERO_WEBHOOK_KEY`** as in the portal for signature verification.
7. **QStash**: If using queue mode, set **`QSTASH_TOKEN`** and **`INTERNAL_ADMIN_SECRET`** (and optionally **`QSTASH_URL`**). The webhook publisher forwards the admin secret via QStash’s **`Upstash-Forward-x-internal-api-secret`** header so deliveries to `<public-origin>/api/jobs/process-event` pass internal auth (`lib/queue/qstash.ts`).
   - **Manual connectivity test (no Xero):** `POST https://<your-host>/api/admin/test-qstash-enqueue` with header **`x-internal-api-secret`** and JSON **`{}`**. Expect **`200`** and a **`messageId`**; Upstash should show a delivery to **`/api/admin/qstash-smoke`**. To hit the real worker with a known row, send **`{ "target": "process-event", "webhookEventId": "<uuid>" }`** (id must exist in **`webhook_events`**).
   - **PowerShell (no curl):** set host and secret, then:

     ```powershell
     $base = "https://<your-host>"
     $secret = "<INTERNAL_ADMIN_SECRET>"
     $headers = @{ "x-internal-api-secret" = $secret }
     Invoke-RestMethod -Method Post -Uri "$base/api/admin/test-qstash-enqueue" `
       -Headers $headers -ContentType "application/json" -Body "{}"
     ```

     Real worker example:

     ```powershell
     Invoke-RestMethod -Method Post -Uri "$base/api/admin/test-qstash-enqueue" `
       -Headers $headers -ContentType "application/json" `
       -Body '{"target":"process-event","webhookEventId":"<uuid-from-webhook_events>"}'
     ```
   - **Verbose `[pipeline]` logs (no redeploy):** after migrations create **`app_runtime_settings`**, use **`GET`** / **`PATCH /api/admin/runtime-settings`** with header **`x-internal-api-secret`**. `PATCH` body: **`{"pipelineDebug": true}`** (or **`false`**). Responses include **`envOverride: true`** when **`PIPELINE_DEBUG=1`** is set in Vercel (env wins over DB for *enabling* logs). Cache TTL is short; toggles take effect within ~15s without restart.

     ```powershell
     Invoke-RestMethod -Method Patch -Uri "$base/api/admin/runtime-settings" `
       -Headers $headers -ContentType "application/json" `
       -Body '{"pipelineDebug":true}'
     ```
8. **Notifications**: Configure Teams and/or Resend; run a controlled test after the first successful process-event.

---

## Safety checks before full traffic

- **Health**: **`GET /api/health`** returns HTTP 200 only when **`DATABASE_URL`** is valid and Postgres responds; otherwise expect **503**.
- **Tenant guard**: If using **`XERO_ALLOWED_TENANT_ID`**, confirm it matches production only.
- **Secrets**: Use distinct values per environment; do not reuse staging webhook or internal secrets in production.
- **Idempotency**: Expect duplicate webhook deliveries; rely on stored webhook events and notify dedupe.
- **Observability**: **`SENTRY_DSN`** is optional in schema; wire Sentry in code when you want production error tracking.

## Related runbooks

- Webhook pipeline triage: `docs/runbooks/webhook-pipeline.md`
- Internal secret rotation: `docs/runbooks/internal-api-secret-rotation.md`
- Key rotation (webhook and crypto): `docs/runbooks/key-rotation.md`
