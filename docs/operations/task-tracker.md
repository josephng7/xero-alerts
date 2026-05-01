# Task Tracker

This tracker is the execution board for the project plan. It is updated continuously during implementation.

## Status Legend

- `pending`: not started
- `in_progress`: currently being implemented
- `blocked`: waiting on dependency/decision
- `done`: implemented and verified

## Project Todos

| ID | Task | Status | Notes |
|---|---|---|---|
| process-setup | Initialize OpenSpec structure, roles, ADR folder, CI, PR template | done | Completed and committed (`64b836f`). |
| scaffold | Bootstrap Next.js + TypeScript repo, env baseline, runnable CI flow | done | Completed and committed (`2cb3867`) with CI fixes (`aee293e`, `3696e0b`, `0cef9dd`). |
| db | Provision Postgres and implement schema/migrations | done | Supabase + Drizzle baseline plus seed + policy hardening: `drizzle/0000_init.sql`, `drizzle/0001_service_role_policies.sql`, `app/api/health` DB probe, CI drift check (`pnpm run db:generate` + `git diff -- drizzle`). OpenSpec `add-postgres-schema`. |
| xero-oauth | Implement OAuth + encrypted token storage + lock-based refresh | done | OAuth connect/callback plus optimistic refresh lock semantics implemented (`add-xero-oauth-foundation`, `add-xero-refresh-lock`) with encrypted persistence and token-version compare-and-swap helper in `lib/xero/refresh.ts`. |
| snapshot-bootstrap | Build admin full-sync endpoint | done | Added `account_snapshots` migration/table + RLS and implemented `/api/admin/sync-snapshots` with token refresh integration and Xero BANK account snapshot upsert (`add-snapshot-bootstrap`). |
| webhook-intake | Build `/api/webhooks/xero` intake with HMAC + dedup + queue | done | Implemented signature verification, idempotent `webhook_events` persistence, and optional QStash handoff to `/api/jobs/process-event` (`add-webhook-intake`). |
| process-event | Build worker processing and diff logic | done | Implemented `/api/jobs/process-event` with webhook-event lookup, token refresh integration, account diff computation, and snapshot upsert (`add-process-event-diff`). |
| poll-org | Build org account polling endpoint and staleness tracking | done | Implemented `/api/cron/poll-org-accounts` with tenant guard, pre/post staleness summary, token refresh integration, account fetch, and snapshot upsert (`add-poll-org-accounts-staleness`). |
| notify | Build Teams/Email notification job with dedup/digest | done | Completed fanout + durable dedupe integration: `notify_dispatches` persistence (`0003_notify_dispatches.sql`), shared notify worker, and process-event notify handoff (`complete-notify-dedupe-integration`). |
| ui | Build dashboard, detail, ack and audit UI | in_progress | UI baseline shipped (`add-ui-backlog-baseline`): dashboard summary + webhook list + alert detail/ack scaffolding; full alerts workflow and audit surfaces still pending. |
| security | Complete signature checks, RBAC, masking, key-rotation hardening | in_progress | Route validation + internal auth hardening landed (`harden-route-validation-pass`, `harden-internal-route-auth`): JSON/content-length checks, sanitized error responses, and shared-secret guard on admin/job/cron routes; RBAC/rotation hardening still pending. |
| domain-email | Configure alert domain + SPF/DKIM/DMARC + Resend domain | pending | External infra task. |
| backups | Weekly backup + quarterly restore process | pending | Requires managed Postgres decision. |
| chaos-tests | Failure injection scenarios and resilience tests | pending | After core pipeline completion. |
| tests | Unit/integration/E2E test suite completion | in_progress | Expanded route + workflow contract coverage for webhook/process-event/poll-org/notify/admin guards (`expand-tests-docs-workflows`) with current suite green. |
| docs | Final setup/runbook docs for operations and rotation | in_progress | Updated README + token/delivery runbooks and added webhook pipeline runbook (`expand-tests-docs-workflows`); final operator pass still pending. |

## Active Session Queue (Autonomous)

1. Keep CI green and unblock regressions quickly.
2. Keep this tracker and logbook up to date after each change.
3. Execute user-approved non-DB tasks in focused commits.

## Autonomous Backlog (Non-DB)

| Workstream | Status | Scope |
|---|---|---|
| CI/QA hardening | done | Added package-manager guard and all-in-one verify command. |
| Test foundation | done | Replaced placeholder tests with runnable `vitest` unit suite. |
| API contract scaffolding | done | Added planned API route stubs returning `501` until business logic lands. |
| Ops runbooks | done | Added incident runbook starters for token and delivery failures. |
| Security primitives | done | HMAC webhook verify, bank normalize, AES-GCM token helpers, tests, key rotation runbook (`add-security-primitives`). Landed on `main` via PR #2. |
| Agents enforcement | done | Cursor always-apply rule, `check:agents` CI guard, PR template checkboxes, CODEOWNERS, `verify` runs compliance scripts. Landed on `main` via PR #2. |
