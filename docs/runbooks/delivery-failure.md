# Delivery Failure Runbook

## Signals
- Teams or email notifications fail repeatedly.
- `POST /api/jobs/notify` returns channel failures or repeated `5xx`.
- Queue retries for downstream jobs increase unexpectedly.

## Immediate Actions
1. Verify upstream status pages (Microsoft Teams webhooks and Resend).
2. Confirm notification env vars are set: `TEAMS_WEBHOOK_URL`, `RESEND_API_KEY`, `ALERTS_FROM_EMAIL`, `ALERTS_TO_EMAIL`.
3. Replay one known-good payload against `/api/jobs/notify` in non-production and confirm channel behavior.
4. If queue handoff is enabled, verify `QSTASH_TOKEN` (and optional `QSTASH_URL`) and check publish failures from webhook intake.

## Recovery
1. Fix invalid credentials, sender domain, or destination webhook/email settings.
2. Reprocess impacted events through `/api/jobs/process-event` then `/api/jobs/notify`.
3. Verify one successful Teams and email send from the same payload.

## Post-Incident
- Add a regression test if the incident exposed a missing validation branch.
- Record follow-up actions in your standard ops tracking workflow.
