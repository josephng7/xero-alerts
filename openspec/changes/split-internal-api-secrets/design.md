# Design: split internal API secrets

## Alternatives considered

1. **Single `INTERNAL_API_SECRET`**  
   Simplest, but no separation between cron and privileged job/admin paths.

2. **Split secrets (`INTERNAL_CRON_SECRET`, `INTERNAL_ADMIN_SECRET`)**  
   Minimal extra env surface; maps cleanly to route classes; limits blast radius. **Chosen.**

3. **Role header + one secret**  
   E.g. `x-internal-role: cron|admin` with one shared secret. One leaked secret still authorizes any role if an attacker can set headers; weaker than split keys.

## Behavior

- `validateCronInternalRouteAuth` uses cron bundle; `validateAdminInternalRouteAuth` uses admin bundle.
- `validateInternalRouteAuth` compares `x-internal-api-secret` to `current` first logically via short-circuit OR of two constant-time compares (both run when previous is set for uniform timing optional - for simplicity we only compare previous when defined).
- Missing primary secret for a route class returns `500` with a generic message.

## Route mapping

| Route | Validator |
|-------|-----------|
| `POST /api/cron/poll-org-accounts` | cron |
| `POST /api/admin/sync-snapshots` | admin |
| `POST /api/jobs/process-event` | admin |
| `POST /api/jobs/notify` | admin |

## Rotation

Optional `*_PREVIOUS` vars accept the outgoing key during overlap. See `docs/runbooks/internal-api-secret-rotation.md`.
