# Add Xero OAuth foundation

## Why

The project can now persist data in Supabase, but OAuth routes are still stubs. We need a secure baseline OAuth connect/callback flow so tenant credentials can be stored and reused by downstream workers.

## What changes

- Implement `/api/connect/xero` to generate state, set a short-lived cookie, and redirect to Xero authorize.
- Implement `/api/oauth/callback` to validate state, exchange code for tokens, fetch tenant metadata, and persist encrypted tokens.
- Add shared OAuth helpers in `lib/xero/oauth.ts`.
- Add DB persistence helper in `lib/db/xero-oauth.ts` that upserts tenant and token rows.
- Add unit coverage for authorize URL generation.

## Impact

- Introduces first live integration path with Xero identity APIs.
- Uses existing `TOKEN_ENCRYPTION_KEY` and DB schema from `add-postgres-schema`.
- Enables subsequent workstreams: token refresh lock, webhook processing, and snapshot sync.
