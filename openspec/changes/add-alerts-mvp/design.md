# Design: Alerts MVP

## Data model

- Table `alerts`: `organization_id` FK to `organizations`, denormalized `xero_tenant_id` for filtering, optional `webhook_event_id` FK for traceability, `title`, `diff` (JSON matching notify diff shape), `acknowledged_at`, `created_at`.
- Unique index on `webhook_event_id` prevents duplicate alerts per webhook event when the column is set (PostgreSQL allows multiple NULLs).

## Alert creation

- `POST /api/jobs/process-event` calls `createAlertFromProcessEventDiff` after snapshot persistence when `isActionableDiff` is true.
- Idempotent per webhook event id: second insert skipped if a row already exists.

## APIs

- All alert HTTP routes use `validateAdminInternalRouteAuth` and `x-internal-api-secret` against `INTERNAL_ADMIN_SECRET` (same class as process-event/notify), matching split-secret layout.
- `GET /api/alerts`: query params `tenantId` (optional), `limit` (default 50, max 100), `cursor` (ISO timestamp of `created_at` for keyset pagination). When `XERO_ALLOWED_TENANT_ID` is set, results are restricted to that tenant; conflicting `tenantId` query returns 403.
- `GET /api/alerts/[id]`: returns 404 if tenant does not match allow-list (same as not found).
- `POST /api/alerts/[id]/ack`: sets `acknowledged_at` if unset; returns success with existing timestamp if already acknowledged.

## UI

- Server components fetch list/detail via same-origin URLs and `INTERNAL_ADMIN_SECRET` (server-only).
- Client acknowledgement uses a server action that POSTs to `ack` with the admin secret so the browser never holds the secret.

## Follow-ups

- Replace server-side self-fetch with direct DB reads or a dedicated server-only module to avoid HTTP overhead.
- Session-scoped or cookie auth for human operators; restrict admin secret to automation only.
