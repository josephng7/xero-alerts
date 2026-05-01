# Add Postgres schema and migrations

## Why

OAuth, webhook intake, snapshots, and alerts all need durable storage. The project already assumes Postgres in the task tracker; this change establishes the database baseline so `xero-oauth` and `webhook-intake` can attach real persistence.

## What changes

- **Tooling**: Pick and wire a migration approach (SQL-first or ORM-driven) compatible with Next.js and CI.
- **Runtime**: Document Supabase `DATABASE_URL`, add a small connection helper, and use the same Supabase Postgres for local dev and deployed environments (no local Docker DB).
- **Schema (MVP slice)**: Versioned migrations for the first tables required by the pipeline (exact list finalized in `design.md` — e.g. org/tenant, encrypted token storage, webhook dedup/idempotency, minimal job/queue bookkeeping if not delegated entirely to QStash).
- **Verification**: Migrations apply cleanly on empty DB; `pnpm run verify` remains green (plus optional `db:migrate` in CI or a documented manual check).

## Impact

- New dependencies and scripts (`db:generate`, `db:migrate`, `db:studio`).
- No change to public API behavior until follow-up changes read/write these tables.
- Security/DevOps: connection string handling, least-privilege DB user for prod (documented).

## Non-goals (this change)

- Full data backfill or production hosting choice (managed vendor).
- Implementing OAuth or webhook business logic (separate changes).
