# Key Rotation Runbook

## Xero webhook signing key (`XERO_WEBHOOK_KEY`)

1. Generate a new signing key in the Xero Developer Portal.
2. Update the value in Vercel (or your host) environment variables.
3. Redeploy so runtime picks up the new secret.
4. Complete Xero intent-to-receive / webhook validation using the new key.

## Xero OAuth client secret (`XERO_CLIENT_SECRET`)

1. Rotate the secret in the Xero Developer Portal.
2. Update environment and redeploy.
3. Force a token refresh or re-run OAuth for the tenant if tokens are invalid.

## Token encryption key (`TOKEN_ENCRYPTION_KEY`)

1. Introduce a new key material (e.g. `TOKEN_ENCRYPTION_KEY_V2`) alongside the current one.
2. Run a one-off re-encryption job (to be implemented with DB access) that decrypts with the old key and encrypts with the new.
3. Swap primary env to the new key and remove the old value after verification.

## QStash signing keys

1. Rotate keys in the Upstash / QStash dashboard as documented by the provider.
2. Update verification configuration if key identifiers or headers change.
3. Redeploy and confirm job endpoints reject invalid signatures.

## Resend API key (`RESEND_API_KEY`)

1. Create a new API key in Resend.
2. Update environment and redeploy.
3. Send a test notification and monitor delivery.

## After any rotation

- Record the change and verification in `docs/operations/logbook.md`.
- Watch error rates for 24 hours after rotation.
