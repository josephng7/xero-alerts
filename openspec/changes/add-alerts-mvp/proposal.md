# Add alerts MVP (persistence, APIs, UI)

## Why

The dashboard had stub alert APIs and placeholder detail UI while webhook and snapshot flows already produced actionable account diffs. Shipping a minimal alerts read model and acknowledgement path completes the operational loop for MVP.

## What changes

- Add `alerts` Postgres table (organization scope, tenant id, optional webhook link, diff payload, acknowledgement timestamp) with service_role RLS aligned to existing tables.
- Implement admin-authenticated `GET /api/alerts` (list + cursor pagination), `GET /api/alerts/[id]`, and `POST /api/alerts/[id]/ack` (idempotent).
- Create alerts when `process-event` computes an actionable bank-account diff for a connected organization.
- Wire the home page and alert detail route to these APIs via server-side fetches and a server action for acknowledgement.

## Impact

- Operators can list and acknowledge alerts without ad hoc DB queries.
- Tenant allow-list (`XERO_ALLOWED_TENANT_ID`) applies consistently on alert APIs.
- Future auth (session or API keys for browser clients) can narrow exposure beyond admin secret without schema churn.

## Non-goals

- Public unauthenticated alert browsing.
- Push notifications or mobile clients.
