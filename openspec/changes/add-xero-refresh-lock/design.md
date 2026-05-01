# Design: token refresh optimistic lock

## Data model leverage

- Existing `xero_oauth_tokens.token_version` is used as the compare-and-swap guard.
- Refresh flow updates:
  - encrypted access token
  - encrypted refresh token
  - access token expiry
  - `token_version = token_version + 1`

## Flow

1. Load org + token row by `xero_tenant_id`.
2. If token is not near expiry (2-minute skew), return cached decrypted access token.
3. If near expiry, call Xero refresh endpoint.
4. Attempt update with `WHERE organization_id = ? AND token_version = current`.
5. If update affected zero rows, another process won the race; reload and retry once.
6. If still conflicted, return retryable error.

## Security

- Tokens are decrypted only in-process when needed and re-encrypted before persistence.
- No token values are returned from route handlers by this helper directly.
