# Go-live runbook and fetch workflow regression test

## Why

Operators need a single cutover checklist that lists env vars, deployment order, and safety checks. Automated coverage should exercise real HTTP mocks for QStash publish and Xero account fetch through the webhook-to-process-event path to catch header and payload regressions.

## What changes

- Add `docs/runbooks/go-live.md` with required variables (including split internal secrets, QStash, Teams, Resend), ordered steps (migrations, OAuth, webhook URL), and safety checks.
- Point README readers at the go-live runbook from required-env and runbooks sections.
- Add a Vitest workflow test that stubs `fetch` for QStash and Xero Accounts while importing real `enqueueProcessEventJob` and `fetchBankAccountSnapshot` behavior.

## Impact

- Faster, safer production rollouts with fewer missed steps.
- Stronger regression signal on queue publish headers and Xero `Authorization` usage next to process-event internal auth.
