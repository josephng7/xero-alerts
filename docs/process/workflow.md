# Development Process

## Workflow
1. Create or update an OpenSpec change under `openspec/changes/<change-id>/`.
2. Implement on `feat/<change-id>` branch (prefer worktree).
3. Verify locally (typecheck, lint, tests, build).
4. Open PR with linked OpenSpec change and verification notes.
5. Merge only after required review checks pass.

## Branch Naming
- `feat/<change-id>`
- `fix/<scope>`
- `chore/<scope>`

## Database

Postgres runs on **Supabase** in every environment (including local dev). Set `DATABASE_URL` in `.env` from the Supabase dashboard; do not use Docker for Postgres on this project.

- After pulling migration changes: `pnpm run db:migrate`
- After editing `lib/db/schema.ts`: `pnpm run db:generate` then commit files under `drizzle/`

## Required Review Areas
Mandatory non-author review for:
- Auth/session logic
- Crypto/signature verification
- Data model migrations
- Notification delivery logic
