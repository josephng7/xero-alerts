# Add org account polling endpoint with staleness summary

## Why

The cron polling path is still a stub, so the system cannot regularly refresh per-tenant account snapshots or report how stale the previous snapshot was before a poll.

## What changes

- Implement `POST /api/cron/poll-org-accounts` to poll one tenant.
- Validate JSON body, required env vars, and `XERO_ALLOWED_TENANT_ID` guard.
- Fetch accounts using refreshed/cached tenant access token and persist snapshot.
- Return a staleness-oriented summary with account count, fetch timestamp, and source details.
- Add focused route tests for guard and successful poll behavior.

## Impact

- Enables production-shaped polling behavior for one tenant at a time.
- Adds explicit freshness signals for cron and operational observability.
