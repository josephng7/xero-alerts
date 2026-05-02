# Execution Logbook

This is a chronological operator log. Each entry records what changed, why, and verification status.

## 2026-05-01

### 05:30-05:52 - Process setup baseline
- Added OpenSpec/process scaffolding, CI workflow, PR template, ADR seed, and role documentation.
- Imported OpenSpec skills and opsx command files into `.cursor/`.
- Commit: `64b836f`.
- Verification: structure checks and lint diagnostics passed.

### 06:00-06:20 - Scaffold and package manager standardization
- Created OpenSpec change: `bootstrap-nextjs-scaffold` (proposal/design/tasks/spec).
- Bootstrapped Next.js + TypeScript app structure (`app/`, `lib/`, config files, `.env.example`).
- Switched from npm to pnpm and updated CI/documentation.
- Commit: `2cb3867`.
- Verification: `pnpm run lint`, `pnpm run typecheck`, `pnpm run build` passed.

### 06:26-06:42 - CI stabilization and regression fixes
- Fixed CI setup order for pnpm/action setup.
- Updated pnpm pin to `10.32.0` from `10.31.0` to avoid known regressions.
- Fixed pnpm command syntax in CI (`pnpm run --if-present <script>`), which resolved typecheck failure.
- Commits: `aee293e`, `3696e0b`, `0cef9dd`.
- Verification: GitHub Actions run `25192762616` completed successfully.

### 06:43-06:47 - Workspace cleanup
- Removed temporary CI reproduction worktree from git worktree tracking.
- Main workspace remained clean.

### 06:51 onward - Task tracking/logbook initialization
- Added persistent tracker and this logbook under `docs/operations/`.
- Purpose: support unattended progress and transparent handoff.

### 06:53-07:00 - Autonomous non-DB hardening batch (completed)
- Added foundational utility modules: `lib/env.ts` (strict env parsing) and `lib/masking.ts` (bank-value masking helper).
- Added test foundation with Vitest (`vitest.config.ts`, `tests/env.test.ts`, `tests/masking.test.ts`).
- Added package-manager guard script at `scripts/check-package-manager.cjs`.
- Added API contract stubs returning `501` for planned routes (webhook/jobs/cron/admin/oauth/alerts).
- Added runbook starters under `docs/runbooks/` for token and delivery failures.
- Updated scaffold OpenSpec tasks checklist to completed in `openspec/changes/bootstrap-nextjs-scaffold/tasks.md`.
- Verification complete: `pnpm run verify` passed locally (`lint`, `typecheck`, `test`, `build`).
- Follow-up: commit and push this non-DB hardening batch, then confirm GitHub CI status.
- Shipped as commit `e9cd3f6`; GitHub Actions runs for that commit succeeded.

### Follow-up - Security primitives and runbooks (autonomous)
- Added `lib/signature.ts`, `lib/normalize-bank.ts`, and AES-256-GCM token helpers in `lib/crypto.ts`.
- Added Vitest suites: `tests/signature.test.ts`, `tests/normalize-bank.test.ts`, `tests/crypto.test.ts`.
- Added OpenSpec change `add-security-primitives` and `docs/runbooks/key-rotation.md`.
- Repaired logbook heading encoding (ASCII hyphen separators).
- Verification: `pnpm run verify` passed locally (`lint`, `typecheck`, `test`, `build`).
- Push to `origin/main` was blocked by repository rules (CodeQL must report before the commit can land on `main`). The same commits are on `feat/security-primitives` for a PR and merge once checks pass. Open a PR from: https://github.com/josephng7/xero-alerts/pull/new/feat/security-primitives

### 11:45 - Agents enforcement (process)
- Added `.cursor/rules/agents-enforcement.mdc` (always apply), `scripts/check-agents-compliance.cjs`, CI step `check:agents`, PR template process checkboxes, `.github/CODEOWNERS`, and expanded `pnpm run verify` to run PM + agents guards.
- Clarified `AGENTS.md` as canonical; document guard script paths in How we work.
- Verification: `pnpm run verify` passed locally.
- Commit: `5093c6a`. Push to `main` blocked by CodeQL ruleset; use branch `feat/agents-enforcement` and open https://github.com/josephng7/xero-alerts/pull/new/feat/agents-enforcement

### PR #2 merged (security primitives + agents enforcement)
- Merged to `main` as https://github.com/josephng7/xero-alerts/pull/2 (`feat/agents-enforcement`); merge commit `6e456f2`.
- Local `main` fast-forwarded to match `origin/main`. Next: branch from `main` for new work; optional cleanup of stale remote branches (`feat/agents-enforcement`, `feat/security-primitives`).

### DB work started (OpenSpec)
- Created change `openspec/changes/add-postgres-schema/` with `proposal.md`, `design.md`, `tasks.md`, and `specs/persistence/spec.md`.
- Purpose: define Postgres + migrations baseline before `xero-oauth` and `webhook-intake`.
- Tracker: `db` marked `in_progress`.
- Verification: documentation-only; `pnpm run verify` not re-run for this log entry.

### DB baseline implemented (Supabase + Drizzle)
- Postgres via **Supabase** only (no Docker Compose); `.env.example` and `design.md` updated accordingly.
- Added `drizzle-orm`, `postgres`, `drizzle-kit`; `lib/db/schema.ts` (organizations, xero_oauth_tokens, webhook_events), `lib/db/index.ts`, `drizzle.config.ts`.
- Generated migration `drizzle/0000_init.sql` and `drizzle/meta/*`; scripts `db:generate`, `db:migrate`, `db:studio`.
- CI: conditional `pnpm run db:migrate` when repository secret `DATABASE_URL` is set.
- OpenSpec `add-postgres-schema` tasks checked off; tracker `db` set to `done`.
- Verification: `pnpm run verify` passed (check:pm, check:agents, lint, typecheck, test, build).
- Follow-up: set `DATABASE_URL` in `.env` and run `pnpm run db:migrate` against your Supabase project; add `DATABASE_URL` to GitHub Actions for migration checks on `main`/PRs from the same repo.

### 15:53-16:02 - DB post-provision validation and hardening
- Seeded Supabase dev data via MCP (`tenant_demo_001` organization + linked `xero_oauth_tokens` row) and verified joins.
- Added DB-aware health check in `app/api/health/route.ts` (`getDb()` + server-time probe, `503` degraded when DB is unavailable).
- Added CI drift guard in `.github/workflows/ci.yml`: run `pnpm run db:generate` and fail on `git diff -- drizzle`.
- Added migration `drizzle/0001_service_role_policies.sql` and journal entry to enforce explicit `service_role` RLS policies across baseline tables.
- Applied migration in Supabase MCP (`apply_migration` success) and verified policies via `pg_policies`; all baseline tables still show RLS enabled.
- Verification: `pnpm run verify` passed locally after updates.
- Follow-up: replace demo encrypted token values with real encrypted outputs once OAuth flow lands; add authenticated-user policies when app-level reads/writes are introduced.

### 23:56-00:06 - Xero OAuth foundation implementation
- Created OpenSpec change `add-xero-oauth-foundation` (`proposal.md`, `design.md`, `tasks.md`, `specs/oauth/spec.md`).
- Implemented OAuth helpers in `lib/xero/oauth.ts` (state generation, authorize URL, token exchange, tenant connection lookup).
- Implemented token persistence helper in `lib/db/xero-oauth.ts` to upsert `organizations` and encrypted `xero_oauth_tokens`.
- Replaced route stubs:
  - `GET /api/connect/xero` now sets state cookie and redirects to Xero authorize.
  - `GET /api/oauth/callback` now validates state, exchanges code, fetches tenant, encrypts and stores tokens.
- Added unit test `tests/xero-oauth.test.ts` for authorize URL generation.
- Verification: `pnpm run verify` passed locally (`check:pm`, `check:agents`, `lint`, `typecheck`, `test`, `build`).
- Follow-up: implement refresh token lock/version update path and add callback tests with mocked `fetch`.

## 2026-05-02
### 00:06-00:11 - Xero OAuth refresh lock semantics
- Created OpenSpec change `add-xero-refresh-lock` (`proposal.md`, `design.md`, `tasks.md`, `specs/oauth-refresh/spec.md`).
- Extended `lib/xero/oauth.ts` with `refreshAccessToken` helper for `grant_type=refresh_token`.
- Added `lib/xero/refresh.ts` to retrieve tenant token with optimistic concurrency (`token_version` compare-and-swap), including one retry on conflict.
- Added test coverage in `tests/xero-oauth.test.ts` for refresh exchange behavior with mocked `fetch`.
- Verification: `pnpm run verify` passed locally (`check:pm`, `check:agents`, `lint`, `typecheck`, `test`, `build`).
- Follow-up: wire `getTenantAccessToken` into upcoming worker/API paths (`poll-org`, `snapshot-bootstrap`) and add integration tests for concurrent refresh races.

### 00:11-00:18 - Snapshot bootstrap endpoint
- Created OpenSpec change `add-snapshot-bootstrap` (`proposal.md`, `design.md`, `tasks.md`, `specs/snapshots/spec.md`).
- Added `account_snapshots` model + migration `drizzle/0002_account_snapshots.sql` (FK to organizations, unique per org, RLS + service role policy).
- Implemented `lib/xero/accounts.ts` to fetch Xero accounts and map BANK entries into snapshot shape.
- Implemented `lib/db/account-snapshots.ts` upsert helper for latest per-tenant snapshot payload.
- Implemented `POST /api/admin/sync-snapshots` to validate input/env, retrieve tenant token via refresh helper, fetch accounts, and persist snapshot.
- Added test `tests/xero-accounts.test.ts` for account mapping filter behavior.
- Verification: `pnpm run verify` passed locally (`check:pm`, `check:agents`, `lint`, `typecheck`, `test`, `build`).
- Follow-up: run migration `0002_account_snapshots` in Supabase environments and add integration test that mocks Xero response + DB write path.

### 00:18-00:24 - Webhook intake implementation
- Created OpenSpec change `add-webhook-intake` (`proposal.md`, `design.md`, `tasks.md`, `specs/webhook-intake/spec.md`).
- Implemented `POST /api/webhooks/xero` with:
  - `x-xero-signature` verification via existing HMAC helper,
  - deterministic SHA-256 idempotency key from raw body,
  - persisted dedup in `webhook_events`,
  - optional QStash publish to `/api/jobs/process-event` when queue env vars are configured.
- Added `lib/db/webhook-events.ts` (idempotent insert helper) and `lib/queue/qstash.ts` (publish helper).
- Added unit test `tests/webhook-events.test.ts` for idempotency key determinism.
- Verification: `pnpm run verify` passed locally (`check:pm`, `check:agents`, `lint`, `typecheck`, `test`, `build`).
- Follow-up: implement `/api/jobs/process-event` consumer and add integration tests for duplicate re-delivery + queue publish behavior.

### 00:24-00:31 - Process-event worker and diff logic
- Created OpenSpec change `add-process-event-diff` (`proposal.md`, `design.md`, `tasks.md`, `specs/process-event/spec.md`).
- Implemented `/api/jobs/process-event` to:
  - load webhook event by `webhookEventId` or `idempotencyKey`,
  - extract tenant id from payload,
  - fetch valid tenant token via refresh helper,
  - fetch latest Xero BANK accounts,
  - diff against prior snapshot,
  - upsert refreshed snapshot.
- Added `lib/db/process-event.ts` for webhook/snapshot lookup helpers.
- Added `lib/alerts/diff-accounts.ts` for deterministic added/removed/changed account comparison.
- Added unit test `tests/diff-accounts.test.ts` for diff summary behavior.
- Verification: `pnpm run verify` passed locally (`check:pm`, `check:agents`, `lint`, `typecheck`, `test`, `build`).
- Follow-up: add processed-state marker for webhook events and integration tests that mock Xero + queue payload envelopes.

### 00:25-00:33 - Parallel implementation batch (poll-org, notify, security hardening)
- Executed three concurrent agent tracks and merged results without overlapping-doc conflicts.
- Poll-org track (`add-poll-org-accounts-staleness`):
  - Implemented `POST /api/cron/poll-org-accounts` with tenant validation, pre/post staleness evaluation, token retrieval, Xero fetch, and snapshot upsert.
  - Added tests: `tests/poll-org-accounts-route.test.ts`.
- Notify track (`add-notify-job-fanout`):
  - Implemented `POST /api/jobs/notify` baseline fanout with strict payload validation, no-op behavior when no changes, Teams webhook send, and gracefully gated email send.
  - Added tests: `tests/notify-logic.test.ts`.
- Security track (`harden-route-validation-pass`):
  - Added route-level content-type enforcement for JSON intake routes.
  - Added webhook payload size guard and stricter zod body validation in worker/admin routes.
  - Sanitized server error responses in selected routes (`health`, OAuth callback, process-event, snapshot sync) with server-side logging.
  - Added tests: `tests/webhooks-xero-route.test.ts`, `tests/process-event-route.test.ts`, `tests/health-route.test.ts`.
- Verification: each track ran `pnpm run verify`; parent integration verification also run post-merge.
- Follow-up: complete notify digest/dedup persistence, add internal auth/RBAC on admin/worker endpoints, and continue with remaining backlog items (`ui`, `tests`, `docs`).

### 00:35-00:47 - Parallel wave 2 (notify dedupe, security auth, UI baseline, tests/docs)
- Ran four concurrent subagent tracks with evidence-first decision constraints (alternatives compared before implementation).
- Notify completion (`complete-notify-dedupe-integration`):
  - Added `notify_dispatches` persistence (`drizzle/0003_notify_dispatches.sql`) and schema support.
  - Implemented shared notify job orchestration with durable dedupe and retry-safe claim release semantics.
  - Wired process-event route to invoke notify flow idempotently.
- Security completion (`harden-internal-route-auth`):
  - Added shared internal route auth helper and env (`INTERNAL_API_SECRET`) with constant-time secret check.
  - Protected admin/job/cron endpoints with `x-internal-api-secret` guard and explicit 401/403/500 behavior.
- UI baseline (`add-ui-backlog-baseline`):
  - Added dashboard summary/list page and alert detail/ack scaffold surfaces.
  - Kept backend route contracts intact while replacing UI-only stubs with baseline rendering flows.
- Tests/docs expansion (`expand-tests-docs-workflows`):
  - Added route and workflow-contract tests across webhook/process-event/poll-org/notify/admin paths.
  - Updated README/runbooks and added `docs/runbooks/webhook-pipeline.md`.
- Parent integration updates:
  - Synced tracker statuses for notify/ui/security/tests/docs.
  - Ran final integration verification after merge.
- Verification: `pnpm run verify` passed (`check:pm`, `check:agents`, `lint`, `typecheck`, `test`, `build`).
- Follow-up: implement RBAC role model and secret-rotation workflow for internal auth, complete alert UI end-to-end state/actions, and add deeper integration/chaos tests.

### 07:30-08:00 - Parallel wave 3 (alerts MVP, split internal secrets, go-live/tests)
- Ran three concurrent subagent tracks and reconciled in one working tree (no merge conflicts).
- Track 1 — Alerts (`add-alerts-mvp`): `drizzle/0004_alerts.sql`, `lib/db/alerts.ts`, admin-auth `GET /api/alerts`, `GET /api/alerts/[id]`, `POST /api/alerts/[id]/ack`, process-event creates alert rows on actionable bank diff, UI wired via `lib/ui/alerts-data.ts` + server actions.
- Track 2 — Internal auth split (`split-internal-api-secrets`): `INTERNAL_CRON_SECRET` / `INTERNAL_ADMIN_SECRET` (+ optional `*_PREVIOUS`), routes updated to cron vs admin validators; runbook `docs/runbooks/internal-api-secret-rotation.md`.
- Track 3 — Ops/tests (`go-live-runbook-workflow-test`): `docs/runbooks/go-live.md`, workflow integration test `tests/workflow-webhook-queue-xero-fetch.test.ts`, internal-auth unit tests, README link to go-live.
- Verification: `pnpm run verify` passed (`check:pm`, `check:agents`, `lint`, `typecheck`, `test` 65/65, `build`).
- Follow-up: commit when ready; broader RBAC, chaos/E2E, and audit UI remain backlog.
- Operator confirmation: all three parallel tracks (alerts MVP, split internal secrets + rotation, go-live/tests) marked complete for this wave.
- Committed locally as `2409467` (`feat: alerts MVP, split internal secrets, go-live and tests`). Push to `origin/main` blocked by repo rules until CodeQL completes; changes pushed to branch `feat/wave-3-alerts-security-docs` for PR: https://github.com/josephng7/xero-alerts/pull/new/feat/wave-3-alerts-security-docs
- Policy: `AGENTS.md` + `.cursor/rules/git-branch-pr.mdc` — no direct commits on `main`; use feature branch + PR. Opened **PR #11** (consolidated wave 3 + policy): https://github.com/josephng7/xero-alerts/pull/11
- **Merged to `main`:** PR #11 closed and merged (merge commit `62bc5f953d76f4b2d821ac318839484aaba031aa`). Delivers Wave 3 features, split internal secrets, go-live/rotation runbooks, Drizzle `0004_snapshot`, CI workflow guard fix, and CodeQL-safe URL parsing in `tests/workflow-webhook-queue-xero-fetch.test.ts`. Follow-up for operators: apply migration `0004_alerts` where needed; configure `INTERNAL_CRON_SECRET` / `INTERNAL_ADMIN_SECRET`.

## Logging Rules

For each future work block, append:
1. Time window
2. Scope/tasks touched
3. Commit hash(es)
4. Verification performed
5. Follow-up risks or pending actions
