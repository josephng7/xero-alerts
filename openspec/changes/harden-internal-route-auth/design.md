# Design: internal shared-secret guard for operational endpoints

## Scope

Protect these routes with the same internal auth check:

- `POST /api/admin/sync-snapshots`
- `POST /api/jobs/process-event`
- `POST /api/jobs/notify`
- `POST /api/cron/poll-org-accounts`

## Approach

1. Introduce a centralized helper: `validateInternalRouteAuth(request, internalApiSecret)`.
2. Read expected secret from `INTERNAL_API_SECRET`.
3. Compare expected and provided secrets using timing-safe comparison.
4. Return stable responses:
   - `401` when header is missing.
   - `403` when header is wrong.
   - `500` when server secret is misconfigured.

## Security notes

- Use `x-internal-api-secret` header to avoid URL/query leakage.
- Keep failure messages generic and avoid exposing secret material.
- Perform auth check before route-specific logic to reduce attack surface.

## Tradeoff summary

- Shared-secret header is the least invasive mechanism for current repo maturity and test setup.
- JWT/JWS-based internal auth offers stronger key lifecycle and issuer claims but needs signing infrastructure, clock handling, and broader test scaffolding.
- Network allowlisting alone is insufficient for this codebase because route-level tests cannot validate network boundaries and misconfigurations can silently bypass intent.
