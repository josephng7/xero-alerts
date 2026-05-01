# Add Xero webhook intake with dedup and queue handoff

## Why

To start near-real-time processing, the system needs a secure webhook intake endpoint that validates signatures, records idempotent events, and hands work to async processing.

## What changes

- Implement `POST /api/webhooks/xero` with HMAC verification.
- Persist webhook payload with deterministic idempotency key in `webhook_events`.
- Ignore duplicates gracefully.
- Add optional QStash handoff to `/api/jobs/process-event` when queue env vars are configured.

## Impact

- Webhook intake becomes production-shaped for authenticity and deduplication.
- Queue handoff is enabled for configured environments and safely no-ops when queue config is absent.
