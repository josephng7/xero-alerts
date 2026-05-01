# Token Failure Runbook

## Signals
- Worker or poll jobs fail with token refresh/authentication errors.
- Sentry alerts indicate repeated unauthorized responses from Xero APIs.
- `POST /api/jobs/process-event`, `/api/cron/poll-org-accounts`, or `/api/admin/sync-snapshots` return token-related `500` failures.

## Immediate Actions
1. Confirm `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`, and `TOKEN_ENCRYPTION_KEY` are present in runtime.
2. Validate whether token refresh endpoint can be reached from runtime.
3. Confirm tenant guard inputs (`XERO_ALLOWED_TENANT_ID`) are expected and not rejecting valid tenants.
4. Pause noisy retries if failure rate spikes.

## Recovery
1. Trigger manual re-authentication flow for the tenant.
2. Verify refreshed tokens are stored and subsequent requests succeed.
3. Resume queued processing and monitor error rate for 30 minutes.

## Post-Incident
- Record root cause and recovery timeline in logbook.
- Add a regression test or alert threshold if a blind spot was found.
