# Design: process-event worker

## Input contract

- Method: `POST /api/jobs/process-event`
- Body:
  - `{ webhookEventId: string }` OR
  - `{ idempotencyKey: string }`

## Processing flow

1. Load webhook event from DB.
2. Extract tenant id from first event payload entry.
3. Resolve tenant access token with refresh lock helper.
4. Load previous stored snapshot for tenant.
5. Fetch current BANK accounts from Xero.
6. Compute diff (added/removed/changed account ids and summary counts).
7. Persist current snapshot.
8. Return processing summary payload.

## Notes

- The worker currently does not mark a "processed" state on `webhook_events`; idempotency remains enforced at intake storage layer.
- This change is intentionally scoped to processing + diff only; notification fan-out remains in `notify` workstream.
