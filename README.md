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

## Current API Stub Status

The following routes exist as intentional `501 Not implemented yet` stubs to lock in endpoint shape while implementation is pending:

- `/api/webhooks/xero`
- `/api/jobs/process-event`
- `/api/jobs/notify`
- `/api/cron/poll-org-accounts`
- `/api/admin/sync-snapshots`
- `/api/connect/xero`
- `/api/oauth/callback`
- `/api/alerts`
- `/api/alerts/:id/ack`

## Worktree Convention

Use a parent folder layout and create feature worktrees from `main`:

`git worktree add ..\worktrees\feat-<change-id> -b feat/<change-id>`

## Delivery Tracking

- Task tracker: `docs/operations/task-tracker.md`
- Execution logbook: `docs/operations/logbook.md`
