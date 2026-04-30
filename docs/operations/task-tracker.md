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
| db | Provision Postgres and implement schema/migrations | pending | Deferred by request. |
| xero-oauth | Implement OAuth + encrypted token storage + lock-based refresh | pending | Depends on DB foundations. |
| snapshot-bootstrap | Build admin full-sync endpoint | pending | Depends on DB + Xero client. |
| webhook-intake | Build `/api/webhooks/xero` intake with HMAC + dedup + queue | pending | Depends on DB + queue client. |
| process-event | Build worker processing and diff logic | pending | Depends on OAuth + snapshots. |
| poll-org | Build org account polling endpoint and staleness tracking | pending | Depends on OAuth + DB. |
| notify | Build Teams/Email notification job with dedup/digest | pending | Depends on alerts schema + queue. |
| ui | Build dashboard, detail, ack and audit UI | pending | Depends on alerts and auth surfaces. |
| security | Complete signature checks, RBAC, masking, key-rotation hardening | pending | Cross-cutting across routes and UI. |
| domain-email | Configure alert domain + SPF/DKIM/DMARC + Resend domain | pending | External infra task. |
| backups | Weekly backup + quarterly restore process | pending | Requires managed Postgres decision. |
| chaos-tests | Failure injection scenarios and resilience tests | pending | After core pipeline completion. |
| tests | Unit/integration/E2E test suite completion | pending | In progress only after core APIs are implemented. |
| docs | Final setup/runbook docs for operations and rotation | pending | Continuous; final pass near MVP completion. |

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
