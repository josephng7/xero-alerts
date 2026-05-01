# Add notify job fan-out

## Why

The processing worker now returns a structured account diff, but no notification channel consumes it yet. We need a minimal notification endpoint that can emit actionable changes to Teams and optionally to email.

## What changes

- Implement `POST /api/jobs/notify` with a validated payload containing tenant id and diff summary.
- Add no-op behavior for zero-change diffs.
- Send concise Teams message when `TEAMS_WEBHOOK_URL` is configured.
- Gate email delivery behind `RESEND_API_KEY`, `ALERTS_FROM_EMAIL`, and `ALERTS_TO_EMAIL` with explicit skip status when unset.
- Add unit tests for no-op decision logic and message formatting.

## Impact

- Adds a real but minimal notification fan-out for processed webhook events.
- Keeps delivery safe in partially configured environments by returning per-channel outcomes instead of failing hard.
