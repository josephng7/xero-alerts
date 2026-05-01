# Add admin snapshot bootstrap endpoint

## Why

After OAuth token persistence is in place, operators need a deterministic way to pull the latest bank account baseline from Xero and store it in Postgres before event processing begins.

## What changes

- Add `account_snapshots` persistence table and migration.
- Implement `/api/admin/sync-snapshots` to:
  - load/refresh tenant access token
  - fetch bank accounts from Xero
  - upsert a per-tenant snapshot row
- Add account mapping unit test.

## Impact

- Creates the first "full sync" bootstrap primitive used by downstream diff and notification flows.
- Keeps snapshot writes idempotent at org scope using a unique `organization_id` constraint.
