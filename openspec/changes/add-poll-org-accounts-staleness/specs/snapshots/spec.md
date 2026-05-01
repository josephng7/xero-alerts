# Snapshots

## Purpose

Maintain current tenant account snapshots and provide staleness-aware polling signals.

## Requirements

### Requirement: Poll org endpoint refreshes one tenant snapshot

The system MUST provide a cron endpoint that polls one tenant account set from Xero and persists the latest snapshot.

#### Scenario: Valid tenant poll request

- **WHEN** `POST /api/cron/poll-org-accounts` is called with a valid `tenantId`
- **THEN** the system fetches BANK accounts from Xero and upserts that tenant's snapshot.

### Requirement: Poll response includes staleness summary

The poll response MUST include staleness-oriented fields for operational use.

#### Scenario: Successful poll response

- **WHEN** polling completes successfully
- **THEN** response includes `accountCount`, `fetchedAt`, and `sourceUsed`
- **AND** response includes `staleness.beforePoll` plus `staleness.afterPoll`.

### Requirement: Poll endpoint enforces tenant guard

If `XERO_ALLOWED_TENANT_ID` is configured, the poll endpoint MUST reject all other tenant IDs.

#### Scenario: Mismatched tenant

- **WHEN** request `tenantId` differs from configured allowed tenant
- **THEN** response is `403` and no Xero API call is made.
