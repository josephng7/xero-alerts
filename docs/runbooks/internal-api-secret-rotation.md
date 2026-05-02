# Internal API secret rotation

This runbook covers rotating `INTERNAL_CRON_SECRET` and `INTERNAL_ADMIN_SECRET` with optional dual-key overlap using `*_PREVIOUS` environment variables.

## Prerequisites

- Access to the deployment environment (e.g. Vercel/host env settings).
- Ability to update callers that send `x-internal-api-secret` (cron scheduler, QStash destination headers, manual scripts).

## Concepts

- **Current** primary vars: `INTERNAL_CRON_SECRET`, `INTERNAL_ADMIN_SECRET`.
- **Previous** vars (optional): `INTERNAL_CRON_SECRET_PREVIOUS`, `INTERNAL_ADMIN_SECRET_PREVIOUS`. While set, the service accepts either the current or previous value for that route class.
- Rotate **cron** and **admin** secrets independently; each section below applies to one pair.

## Rotate one secret class (cron or admin)

Pair refers to either (`INTERNAL_CRON_SECRET`, `INTERNAL_CRON_SECRET_PREVIOUS`) or (`INTERNAL_ADMIN_SECRET`, `INTERNAL_ADMIN_SECRET_PREVIOUS`).

### 1. Prepare a new secret

Generate a new random string and store it in your password manager (same strength you use for API keys).

### 2. Dual-key overlap (recommended)

1. Set the optional **previous** var to the **old** secret value (the value callers use today).
2. Set the **primary** var to the **new** secret value.
3. Deploy. The app accepts either old (via previous) or new (via primary).
4. Update every caller for that class (cron or admin) to send the **new** secret in `x-internal-api-secret`.
5. Confirm traffic is stable, then clear the **previous** var and deploy.

### 3. Verify

- Hit a cron route with header = old secret (should succeed while previous matches).
- Hit with new secret (should succeed).
- Hit with random string (403).

### 4. Clean up

Unset `INTERNAL_CRON_SECRET_PREVIOUS` or `INTERNAL_ADMIN_SECRET_PREVIOUS` when no caller uses the old value.

## Caller-specific notes

- **Vercel Cron / external scheduler:** Update scheduled job config to send `x-internal-api-secret` = cron secret (after rotation, the new value).
- **QStash / job HTTP targets:** Configure destination headers so `/api/jobs/process-event` and `/api/jobs/notify` receive the **admin** secret.
- **Manual admin scripts:** Use the admin secret for `/api/admin/sync-snapshots`.

## Rollback

If a bad deploy locks callers out, restore prior env values from your secrets backup or redeploy the last known-good configuration. Dual-key overlap prevents hard cutovers when previous is set correctly.
