# Trust boundaries and secrets

This page summarizes **who authenticates what**. Operational steps (env vars, rotation, rollbacks) live in **runbooks**, not here.

## External callers

| Caller | Mechanism | Protects |
| ------ | --------- | -------- |
| **Xero** → `POST /api/webhooks/xero` | `x-xero-signature` HMAC using `XERO_WEBHOOK_KEY` | Only genuine Xero-delivered payloads are accepted. |
| **Scheduled poller** → `POST /api/cron/poll-org-accounts` | Header `x-internal-api-secret` must match `INTERNAL_CRON_SECRET` (or `INTERNAL_CRON_SECRET_PREVIOUS` during rotation). | Cron-only routes. |
| **Queue / jobs / admin / alerts APIs** → `POST /api/jobs/*`, `POST /api/admin/*`, `GET/POST /api/alerts/*` | Same header name; value must match `INTERNAL_ADMIN_SECRET` (or `INTERNAL_ADMIN_SECRET_PREVIOUS`). | Worker handoff, admin sync, alert read/ack. |

The header name is always **`x-internal-api-secret`**; **which secret value** is valid depends on the route class (**cron** vs **admin/job**) as implemented in `lib/auth/internal-route-auth.ts`.

## Application ↔ Postgres

- The server uses **`DATABASE_URL`** (typically Supabase pooler URI).
- Migrations define **RLS** and **`service_role`** policies; ensure the DB role implied by `DATABASE_URL` matches how you intend to run (server-side app with policies you trust).

Do **not** expose `DATABASE_URL` or internal secrets to the browser.

## Token and payload protection

| Secret | Role |
| ------ | ---- |
| `TOKEN_ENCRYPTION_KEY` | Symmetric key material for **encrypting Xero OAuth tokens at rest** (`xero_oauth_tokens`). Distinct from internal route secrets. |
| `XERO_CLIENT_ID` / `XERO_CLIENT_SECRET` | OAuth code exchange with Xero (Authorization Code flow). |

Rotation guidance for crypto and tokens: [`docs/runbooks/key-rotation.md`](../runbooks/key-rotation.md).

## Optional tenant guard

If **`XERO_ALLOWED_TENANT_ID`** is set, routes that process tenant-scoped work reject other tenant IDs—useful for single-tenant deployments.

## UI and secrets

Dashboard and alert pages are **server-rendered / server actions** where possible so **`INTERNAL_ADMIN_SECRET` is not shipped to the browser**. If you add interactive clients later, prefer session or API-key auth rather than embedding internal secrets in the client.

## Related runbooks

- Go-live and env ordering: [`docs/runbooks/go-live.md`](../runbooks/go-live.md)
- Rotate `INTERNAL_*` secrets: [`docs/runbooks/internal-api-secret-rotation.md`](../runbooks/internal-api-secret-rotation.md)
- Webhook pipeline triage: [`docs/runbooks/webhook-pipeline.md`](../runbooks/webhook-pipeline.md)
