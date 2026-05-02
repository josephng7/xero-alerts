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

- `XERO_CLIENT_ID`
- `XERO_CLIENT_SECRET`
- `XERO_WEBHOOK_KEY`
- `TOKEN_ENCRYPTION_KEY`
- `DATABASE_URL`
- `INTERNAL_CRON_SECRET` (cron routes such as `/api/cron/poll-org-accounts`)
- `INTERNAL_ADMIN_SECRET` (admin and job routes: `/api/admin/sync-snapshots`, `/api/jobs/process-event`, `/api/jobs/notify`)

Public origin for OAuth redirects and QStash job URLs is inferred from optional `NEXTAUTH_URL`, then `VERCEL_URL` on Vercel, then `http://localhost:3000` (`lib/server/app-base-url.ts`). Set `NEXTAUTH_URL` when your public URL must differ from `VERCEL_URL` (for example a custom domain).

For a full production cutover checklist (migrations, OAuth, Xero webhook URL, safety checks), see `docs/runbooks/go-live.md`.

Optional dual-key overlap during rotation: `INTERNAL_CRON_SECRET_PREVIOUS`, `INTERNAL_ADMIN_SECRET_PREVIOUS`. See `docs/runbooks/internal-api-secret-rotation.md`.

Optional but commonly required:

- `XERO_ALLOWED_TENANT_ID` (single-tenant guard)
- `QSTASH_TOKEN` (queue handoff; QStash API URL defaults to `https://qstash.upstash.io` unless you set `QSTASH_URL`)
- `TEAMS_WEBHOOK_URL`, `RESEND_API_KEY`, `ALERTS_FROM_EMAIL`, `ALERTS_TO_EMAIL` (notifications)

## Worktree Convention

Use a parent folder layout and create feature worktrees from `main`:

`git worktree add ..\worktrees\feat-<change-id> -b feat/<change-id>`

## Delivery Tracking

- Task tracker: `docs/operations/task-tracker.md`
- Execution logbook: `docs/operations/logbook.md`

## Architecture

- Platform / data-flow diagrams and trust boundaries: `docs/architecture/README.md`

## Runbooks

- Go-live (env, migrations, OAuth, webhook URL): `docs/runbooks/go-live.md`
- Key rotation: `docs/runbooks/key-rotation.md`
- Internal API secret rotation: `docs/runbooks/internal-api-secret-rotation.md`
- Token failures: `docs/runbooks/token-failure.md`
- Delivery failures: `docs/runbooks/delivery-failure.md`
