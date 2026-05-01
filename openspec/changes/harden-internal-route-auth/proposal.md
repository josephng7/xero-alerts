# Harden internal route authentication

## Why

Internal/admin endpoints currently rely on input validation but do not require explicit caller authentication. That leaves sensitive operational routes open to accidental or unauthorized invocation from inside or outside trusted infrastructure.

## What changes

- Add a shared-secret internal auth guard for operational routes.
- Require `x-internal-api-secret` header validation against `INTERNAL_API_SECRET`.
- Apply the guard to:
  - `POST /api/admin/sync-snapshots`
  - `POST /api/jobs/process-event`
  - `POST /api/jobs/notify`
  - `POST /api/cron/poll-org-accounts`
- Add tests for unauthorized and authorized execution paths on each protected route.

## Impact

- Missing or invalid internal auth now fails fast with `401`/`403`.
- Valid internal callers continue through existing request validation and business logic.
- Route behavior becomes safer without introducing a new token service or key rotation system.
