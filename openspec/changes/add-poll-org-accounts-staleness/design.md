# Design: org polling and staleness tracking

## Endpoint contract

- Method: `POST /api/cron/poll-org-accounts`
- Body: `{ "tenantId": "<xero-tenant-id>" }`
- Success response includes:
  - `accountCount`
  - `fetchedAt`
  - `sourceUsed` (snapshot source and token source)
  - `staleness.beforePoll` and `staleness.afterPoll`

## Polling flow

1. Parse env and assert `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`, and `TOKEN_ENCRYPTION_KEY`.
2. Parse request body and assert `tenantId`.
3. Enforce `XERO_ALLOWED_TENANT_ID` when configured.
4. Load pre-poll staleness from current snapshot metadata.
5. Resolve tenant access token with refresh helper.
6. Fetch BANK accounts from Xero.
7. Upsert latest snapshot and return staleness-oriented payload.

## Staleness model

- Staleness is evaluated against a fixed threshold (15 minutes).
- Before polling:
  - `missing` if no prior snapshot exists
  - `fresh` if age is within threshold
  - `stale` otherwise
- After successful poll, status is always `fresh` with `ageSeconds = 0`.

## Error handling

- `400` for invalid JSON or missing `tenantId`.
- `403` for disallowed tenant.
- `500` for missing required env vars or upstream failures.
