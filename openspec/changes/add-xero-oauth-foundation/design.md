# Design: Xero OAuth foundation

## Route flow

- `GET /api/connect/xero`
  - Validate `XERO_CLIENT_ID` and `NEXTAUTH_URL`.
  - Generate cryptographically random OAuth `state`.
  - Set `xero_oauth_state` HTTP-only cookie (10 minutes, `SameSite=Lax`).
  - Redirect to Xero authorize URL.

- `GET /api/oauth/callback`
  - Validate `code` and `state` query params.
  - Compare `state` against cookie.
  - Exchange `code` for access/refresh tokens using Xero token endpoint.
  - Fetch tenant info from `GET https://api.xero.com/connections`.
  - Encrypt tokens with `TOKEN_ENCRYPTION_KEY`.
  - Upsert `organizations` and `xero_oauth_tokens`.
  - Clear state cookie.

## Persistence model

- Organization identity is anchored on `organizations.xero_tenant_id` (unique).
- Token row is anchored on `xero_oauth_tokens.organization_id` (unique).
- Callback is idempotent for a tenant; re-auth overwrites token values and expiry.

## Security baseline

- CSRF defense: state cookie + callback query match.
- Token-at-rest: AES-256-GCM via existing `lib/crypto.ts`.
- Minimal route output: no token material returned to client.

## Out of scope

- Refresh token lock/rotation semantics.
- Multi-tenant selection if multiple Xero connections are returned.
- Session/authZ gating for who may initiate connect.
