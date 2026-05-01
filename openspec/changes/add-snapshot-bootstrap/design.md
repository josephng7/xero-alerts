# Design: snapshot bootstrap

## Endpoint contract

- Method: `POST /api/admin/sync-snapshots`
- Body: `{ "tenantId": "<xero-tenant-id>" }`
- Behavior:
  - validate env (`XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`, `TOKEN_ENCRYPTION_KEY`)
  - obtain tenant token using optimistic refresh helper
  - fetch Xero accounts and keep BANK-type entries
  - upsert snapshot payload for the tenant

## Persistence

- New table: `account_snapshots`
  - unique per `organization_id`
  - stores latest snapshot payload (`jsonb`) and fetch timestamp
- RLS enabled with `service_role` policy for backend execution paths.

## Error handling

- `400` for invalid body/missing tenantId.
- `403` when `XERO_ALLOWED_TENANT_ID` is configured and mismatched.
- `500` for upstream token/Xero/DB failures with concise message.
