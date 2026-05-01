# Add Xero token refresh lock semantics

## Why

OAuth connect/callback now stores encrypted tokens, but token refresh still needs concurrency safety so multiple workers do not race and overwrite each other with stale values.

## What changes

- Add a refresh orchestration helper that:
  - reads stored token material by tenant
  - refreshes only when near expiry
  - updates tokens with optimistic locking on `token_version`
- Reuse existing AES-GCM encryption utilities for writes and decrypt for reads.
- Add unit coverage for refresh token exchange helper.

## Impact

- Enables safe token retrieval for worker jobs.
- Reduces risk of refresh races and invalid token state.
