# xero-alerts

## Process Setup

This repository starts with process scaffolding before feature implementation:

- OpenSpec framework in `openspec/`
- Role definitions in `docs/agents/roles.md`
- ADR-lite decision log in `docs/decisions/`
- Worktree/development workflow in `docs/process/workflow.md`
- CI checks in `.github/workflows/ci.yml`
- PR review checklist in `.github/pull_request_template.md`

## Scaffold

The app now includes a minimal Next.js + TypeScript baseline.

### Local development

1. Copy `.env.example` to `.env.local` and fill required values.
2. Install dependencies: `pnpm install`
3. Start dev server: `pnpm run dev`
4. Verify health route: `GET /api/health`

### Verification commands

- `pnpm run lint`
- `pnpm run typecheck`
- `pnpm run test`
- `pnpm run build`
- `pnpm run verify`

## Current API Behavior

Implemented worker and ops endpoints:

- `/api/webhooks/xero`: verifies Xero signature, deduplicates webhook payloads, persists webhook events, and optionally enqueues `/api/jobs/process-event` via QStash.
- `/api/jobs/process-event`: resolves a webhook event by id/idempotency key, enforces optional tenant allow-list, refreshes account snapshot, and returns account diff summary.
- `/api/jobs/notify`: validates diff payloads, no-ops when no actionable changes, and fans out Teams + email notifications.
- `/api/cron/poll-org-accounts`: polls one tenant, persists snapshot, and returns before/after staleness summary.
- `/api/admin/sync-snapshots`: manually syncs one tenant snapshot with the same tenant guard.

OAuth and status endpoints:

- `/api/connect/xero`: initiates OAuth authorize redirect.
- `/api/oauth/callback`: exchanges auth code and stores tenant token metadata.
- `/api/health`: basic runtime health contract.

## Required Environment Variables

Minimum env set for webhook-to-notify flow:

- `NEXTAUTH_URL`
- `XERO_CLIENT_ID`
- `XERO_CLIENT_SECRET`
- `XERO_WEBHOOK_KEY`
- `TOKEN_ENCRYPTION_KEY`
- `DATABASE_URL`
- `INTERNAL_API_SECRET` (required for internal worker/cron/admin routes)

Optional but commonly required:

- `XERO_ALLOWED_TENANT_ID` (single-tenant guard)
- `QSTASH_URL`, `QSTASH_TOKEN` (queue handoff)
- `TEAMS_WEBHOOK_URL`, `RESEND_API_KEY`, `ALERTS_FROM_EMAIL`, `ALERTS_TO_EMAIL` (notifications)

## Worktree Convention

Use a parent folder layout and create feature worktrees from `main`:

`git worktree add ..\worktrees\feat-<change-id> -b feat/<change-id>`

## Delivery Tracking

- Task tracker: `docs/operations/task-tracker.md`
- Execution logbook: `docs/operations/logbook.md`

## Runbooks

- Key rotation: `docs/runbooks/key-rotation.md`
- Token failures: `docs/runbooks/token-failure.md`
- Delivery failures: `docs/runbooks/delivery-failure.md`
