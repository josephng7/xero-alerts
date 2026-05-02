# Split internal API secrets (RBAC-style)

## Why

A single `INTERNAL_API_SECRET` grants every caller access to cron, admin, and job endpoints. That increases blast radius on leak and complicates least-privilege scheduling.

## What changes

- Replace `INTERNAL_API_SECRET` with role-scoped secrets:
  - `INTERNAL_CRON_SECRET` (+ optional `INTERNAL_CRON_SECRET_PREVIOUS`) for scheduled cron routes.
  - `INTERNAL_ADMIN_SECRET` (+ optional `INTERNAL_ADMIN_SECRET_PREVIOUS`) for admin and worker job routes.
- Keep header name `x-internal-api-secret`; callers send the secret appropriate to the route class.
- Optional `*_PREVIOUS` env vars allow a dual-key rotation window (accept current or previous).

## Impact

- Deployments must set both primary secrets; callers that used one shared value should split or duplicate intentionally per role.
- QStash and other job triggers must use the admin secret on `/api/jobs/*`. Cron schedulers use the cron secret on `/api/cron/*`.

## Non-goals

- Replacing QStash JWT verification or adding a full IAM system.
- Renaming the `x-internal-api-secret` header per role (would multiply client changes).
