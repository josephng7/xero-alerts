# Webhook Pipeline Runbook

## Scope
- Webhook intake: `POST /api/webhooks/xero`
- Processing worker: `POST /api/jobs/process-event`
- Notification fanout: `POST /api/jobs/notify`

## Required Env
- Core: `NEXTAUTH_URL`, `XERO_WEBHOOK_KEY`, `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`, `TOKEN_ENCRYPTION_KEY`, `DATABASE_URL`, `INTERNAL_API_SECRET`
- Queue (optional): `QSTASH_URL`, `QSTASH_TOKEN`
- Notify (optional): `TEAMS_WEBHOOK_URL`, `RESEND_API_KEY`, `ALERTS_FROM_EMAIL`, `ALERTS_TO_EMAIL`

## Quick Triage
1. Check webhook intake response class:
   - `401`: invalid signature (`XERO_WEBHOOK_KEY` mismatch).
   - `200`: duplicate webhook (already recorded).
   - `202`: accepted (queued or queue-disabled mode).
2. If queued mode is expected, confirm queue metadata appears and QStash publish succeeds.
3. Validate process-event can resolve event by `webhookEventId` or `idempotencyKey`.
4. Confirm notify receives a valid diff payload and is not skipped due to no-op summary.

## Recovery Playbook
1. Re-send affected webhook payload to intake once signing configuration is fixed.
2. Re-run process worker with the recorded `idempotencyKey` if intake already succeeded.
3. Re-run notify with `tenantId`, `idempotencyKey`, and diff from process-event response.
4. Confirm Teams/email delivery with one real payload before closing incident.
