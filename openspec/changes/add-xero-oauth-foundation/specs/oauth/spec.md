# OAuth

## Purpose

Connect a Xero tenant through OAuth and persist encrypted credentials for server-side use.

## Requirements

### Requirement: Start OAuth connect flow

The system MUST expose a route that redirects to Xero authorize with a unique state value.

#### Scenario: Connect request succeeds

- **WHEN** `GET /api/connect/xero` is called with required env variables configured
- **THEN** the response is `302` to Xero authorize URL
- **AND** an HTTP-only `xero_oauth_state` cookie is set.

### Requirement: Validate callback state before token exchange

The callback MUST reject requests with missing or mismatched state.

#### Scenario: State mismatch

- **WHEN** callback `state` differs from cookie state
- **THEN** the system returns `400` and does not call token exchange.

### Requirement: Persist encrypted token pair

After successful code exchange, the system MUST store encrypted access/refresh tokens tied to a tenant organization.

#### Scenario: Tenant reconnect

- **WHEN** a tenant already exists and reconnects
- **THEN** existing token row is updated with new encrypted values and expiry.
