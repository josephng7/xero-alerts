# Design: complete notify dedupe integration

## Approach options considered

1. In-memory dedupe in API route:
   - Simple, no schema changes.
   - Fails across process restarts and multi-instance deployments.
2. DB-backed dedupe keyed by digest:
   - Durable across restarts and deployments.
   - Aligns with existing Drizzle/Postgres persistence model.

Selected: DB-backed dedupe keyed by normalized payload digest.

## Flow

1. Validate notify payload with a shared schema.
2. If diff has no actionable changes, return `no-op`.
3. Compute digest and attempt insert into `notify_dispatches` with unique dedupe key.
4. If unique conflict, return `deduped` and skip channel sends.
5. Send Teams and email channels.
6. If no channel succeeds, delete the claimed dedupe row so retry can deliver later.
7. Return channel statuses and dedupe key.

## Process-event integration

- `POST /api/jobs/process-event` computes diff and persists snapshot as before.
- After snapshot persistence, it invokes shared notify worker logic directly and includes notify result in response.
- Internal route remains auth-guarded; notification fan-out does not rely on loopback HTTP.
