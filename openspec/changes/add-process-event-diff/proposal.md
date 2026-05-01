# Add process-event worker with snapshot diff

## Why

Webhook intake now records deduplicated events and can enqueue work, but `/api/jobs/process-event` is still a stub. We need worker logic to compute account changes and refresh snapshots.

## What changes

- Implement `/api/jobs/process-event` to:
  - load stored webhook event
  - resolve tenant id from payload
  - fetch a valid tenant token
  - retrieve latest Xero bank accounts
  - diff against previous snapshot
  - upsert fresh snapshot
- Add diff helper and unit tests.

## Impact

- Establishes first end-to-end event processing path from intake to computed diff.
- Produces structured change summary for downstream notification logic.
