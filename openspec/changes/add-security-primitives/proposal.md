# Add security primitives (non-DB)

## Why

Webhook intake and token storage require correct, test-covered crypto primitives before wiring persistence and routes.

## What changes

- Xero webhook HMAC-SHA256 verification with constant-time comparison.
- Bank detail normalization aligned with the MVP normalization rules.
- AES-256-GCM encrypt/decrypt helpers for token material at rest.
- Unit tests and a key rotation runbook.

## Impact

- No database or route behavior change beyond existing stubs.
- Enables the `webhook-intake` and `xero-oauth` todos to reuse shared utilities.
