# Complete notify dedupe integration

## Why

`/api/jobs/notify` currently sends based on payload shape but does not persist dispatch fingerprints. `/api/jobs/process-event` computes diffs and persists snapshots, but notification fan-out is not part of the durable worker output.

## What changes

- Add durable DB-backed notify dedupe persistence keyed by a normalized digest.
- Share notify worker logic so `process-event` and `/api/jobs/notify` use the same behavior.
- Trigger notify flow from `process-event` after snapshot persistence.
- Keep retries idempotent by returning deduped status for repeated actionable diffs.
- Add tests for dedupe and process-event notify integration.

## Impact

- Repeated job runs avoid duplicate outbound alerts for the same digest.
- Notify behavior becomes a worker concern instead of only an endpoint concern.
