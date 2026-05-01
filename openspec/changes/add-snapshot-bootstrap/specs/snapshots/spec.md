# Snapshots

## Purpose

Allow operators to bootstrap tenant bank-account snapshots from Xero into Postgres.

## Requirements

### Requirement: Full sync endpoint persists latest tenant snapshot

The system MUST provide an admin endpoint that fetches bank accounts from Xero and stores the latest payload for a tenant.

#### Scenario: Valid tenant sync

- **WHEN** `POST /api/admin/sync-snapshots` is called with a valid `tenantId`
- **THEN** the system fetches Xero bank accounts and upserts one snapshot row for that tenant.

### Requirement: Enforce tenant guard when configured

If `XERO_ALLOWED_TENANT_ID` is set, the endpoint MUST reject other tenant IDs.

#### Scenario: Mismatched tenantId

- **WHEN** request `tenantId` differs from configured allowed tenant
- **THEN** the system returns `403` and does not call Xero APIs.
