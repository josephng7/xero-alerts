# Design: webhook intake

## Intake flow

1. Read raw body bytes.
2. Verify `x-xero-signature` against `XERO_WEBHOOK_KEY`.
3. Parse JSON payload.
4. Compute idempotency key as SHA-256(raw body).
5. Insert into `webhook_events` with unique idempotency constraint.
6. If inserted:
   - attempt QStash publish to `/api/jobs/process-event` when queue env is present.
   - return `202`.
7. If duplicate:
   - return `200` duplicate ignored.

## Queue behavior

- Queue handoff is optional and controlled by `QSTASH_URL`, `QSTASH_TOKEN`, `NEXTAUTH_URL`.
- Failures in queue publish do not lose intake data; webhook row is already persisted.

## Security

- Reject invalid signatures with `401`.
- No plaintext secret material returned in responses.
