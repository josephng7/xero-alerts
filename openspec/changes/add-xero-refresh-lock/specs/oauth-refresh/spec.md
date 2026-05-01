# OAuth Refresh

## Purpose

Retrieve valid tenant access tokens while preventing concurrent refresh races.

## Requirements

### Requirement: Return cached token when still valid

The system MUST return the stored access token when it is not close to expiry.

#### Scenario: Token has sufficient TTL

- **WHEN** `access_token_expires_at` is more than two minutes in the future
- **THEN** the system returns the decrypted token without performing refresh.

### Requirement: Refresh with optimistic lock

When token is near expiry, the system MUST refresh and update using `token_version` compare-and-swap.

#### Scenario: Single refresher wins

- **WHEN** two workers attempt refresh on the same tenant simultaneously
- **THEN** only one update succeeds for the current `token_version`
- **AND** the losing worker reloads and uses the newer record.
