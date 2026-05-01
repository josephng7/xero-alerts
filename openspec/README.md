# OpenSpec

This repository uses OpenSpec change management:

propose -> design -> tasks -> apply -> verify -> archive

## Layout

- `openspec/specs/`: canonical capability specs.
- `openspec/changes/<change-id>/`: per-change proposal, design, tasks, and spec deltas.

## Change Id Convention

Use kebab-case ids, e.g. `add-webhook-intake`.

## Database (Supabase)

Postgres is hosted on **Supabase** for local dev and production. Copy the **Database → Connection string** URI into `.env` as `DATABASE_URL` (transaction pooler is recommended for Next.js).

- Apply migrations: `pnpm run db:migrate`
- Generate SQL after editing `lib/db/schema.ts`: `pnpm run db:generate`

CI applies migrations when the `DATABASE_URL` repository secret is configured.
