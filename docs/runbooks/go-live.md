# Go-live checklist

Use this checklist when deploying the app to a new environment or cutting over production traffic.

## Required environment variables

Set these in your hosting provider (or `.env.local` for manual verification). Values must be non-empty where marked required.

### Database

| Variable | Purpose |
| -------- | ------- |
| `DATABASE_URL` | Postgres connection URI (for example Supabase pooler). Required for persistence. |

### Xero

| Variable | Purpose |
| -------- | ------- |
| `XERO_CLIENT_ID` | OAuth client ID from the Xero developer app. |
| `XERO_CLIENT_SECRET` | OAuth client secret. |
| `XERO_WEBHOOK_KEY` | Webhook signing key from Xero (must match the key used to verify `x-xero-signature`). |

Optional:

| Variable | Purpose |
| -------- | ------- |
| `XERO_ALLOWED_TENANT_ID` | If set, process-event and related routes reject other tenant IDs (single-tenant guard). |

### App URLs and session

| Variable | Purpose |
| -------- | ------- |
| `NEXTAUTH_URL` | Public base URL of this deployment (used for OAuth redirects and QStash callback base URL). Use `https://` in production. |
| `NEXTAUTH_SECRET` | Session secret for NextAuth when using auth features that require it. |

### Token storage

| Variable | Purpose |
| -------- | ------- |
| `TOKEN_ENCRYPTION_KEY` | Symmetric key used to encrypt OAuth tokens at rest. |

### Internal API authentication

Worker, admin, and cron routes validate the `x-internal-api-secret` header against split secrets (not a single `INTERNAL_API_SECRET` name in env):

| Variable | Purpose |
| -------- | ------- |
| `INTERNAL_ADMIN_SECRET` | Required for `POST /api/jobs/process-event`, `POST /api/jobs/notify`, and admin routes such as `POST /api/admin/sync-snapshots`. |
| `INTERNAL_CRON_SECRET` | Required for `POST /api/cron/poll-org-accounts` and other cron-style callers. |

Optional rotation overlap: `INTERNAL_ADMIN_SECRET_PREVIOUS`, `INTERNAL_CRON_SECRET_PREVIOUS`. See `docs/runbooks/internal-api-secret-rotation.md`.

### Queue (QStash)

For webhook-to-worker handoff without blocking the HTTP request:

| Variable | Purpose |
| -------- | ------- |
| `QSTASH_URL` | Upstash QStash API base (for example `https://qstash.upstash.io`). |
| `QSTASH_TOKEN` | Bearer token for publishing. |

Verify callbacks: configure QStash signing keys in the deployment if you verify Upstash signatures (`QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY` in `.env.example` when applicable).

### Notifications

| Variable | Purpose |
| -------- | ------- |
| `TEAMS_WEBHOOK_URL` | Incoming webhook URL for Microsoft Teams alerts. |
| `RESEND_API_KEY` | Resend API key for email. |
| `ALERTS_FROM_EMAIL` | Sender address (must be allowed in Resend). |
| `ALERTS_TO_EMAIL` | Recipient for alert email. |

## Order of operations

1. **Database**: Create or select a Postgres instance. Set `DATABASE_URL`.
2. **Migrations**: From a trusted machine with env loaded, run `pnpm run db:migrate` so schema matches `drizzle/` migrations.
3. **Secrets**: Set `TOKEN_ENCRYPTION_KEY`, `INTERNAL_ADMIN_SECRET`, `INTERNAL_CRON_SECRET`, `XERO_CLIENT_*`, `XERO_WEBHOOK_KEY`, and notification/queue vars as needed.
4. **Deploy**: Deploy the application with `NEXTAUTH_URL` set to the final public HTTPS origin (no trailing slash issues on your host).
5. **OAuth connect**: Complete Xero OAuth once per environment so tenant tokens exist (`/api/connect/xero` then callback). Confirm the organization appears in the database if you inspect rows.
6. **Webhook URL**: In the Xero developer portal, set the app webhook URL to:

   `https://<your-host>/api/webhooks/xero`

   Use the same `XERO_WEBHOOK_KEY` value as configured in the developer app for signature verification.
7. **QStash**: If using queue mode, ensure `QSTASH_URL`, `QSTASH_TOKEN`, and `NEXTAUTH_URL` are set so publish targets `https://<NEXTAUTH_URL>/api/jobs/process-event`. Confirm QStash delivers with `x-internal-api-secret` matching `INTERNAL_ADMIN_SECRET` as configured for your worker invocation path.
8. **Notifications**: Configure Teams and/or Resend and send a controlled test after the first successful process-event (see safety checks).

## Safety checks before full traffic

- **Health**: `GET /api/health` returns success from the deployed host.
- **Tenant guard**: If using `XERO_ALLOWED_TENANT_ID`, confirm it matches your production tenant only.
- **Secrets**: Confirm production secrets are not reused from staging; webhook and internal secrets are independent per environment.
- **Idempotency**: Expect duplicate webhook deliveries; rely on stored webhook events and notify dedupe rather than disabling checks.
- **Observability**: Optional `SENTRY_DSN` for error tracking in production.

## Related runbooks

- Webhook pipeline triage: `docs/runbooks/webhook-pipeline.md`
- Internal secret rotation: `docs/runbooks/internal-api-secret-rotation.md`
- Key rotation (webhook and crypto): `docs/runbooks/key-rotation.md`
