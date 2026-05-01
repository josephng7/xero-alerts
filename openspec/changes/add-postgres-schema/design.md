# Design: Postgres baseline

## Locked decisions

1. **Migration tool**  
   **Drizzle ORM** + **drizzle-kit** for schema-as-code and versioned SQL migrations under `drizzle/`.

2. **Postgres host**  
   **Supabase** for **all** environments: local development, CI (via repo secret), and production. **No Docker Postgres** on developer machines.

3. **Postgres version**  
   Follow the version Supabase exposes (15+); treat **16** as the compatibility baseline where it matters.

4. **Connection model**  
   - `DATABASE_URL` is the Supabase connection URI from the dashboard (prefer **transaction pooler** for Next.js unless a workflow requires a direct/session connection).  
   - Single shared `getDb()` in `lib/db` backed by `postgres.js`; no ad hoc clients at call sites.

5. **Initial tables**  
   See `lib/db/schema.ts` and migrations: `organizations`, `xero_oauth_tokens`, `webhook_events`.

6. **Local dev**  
   Create a Supabase project (or use a shared dev project), copy **Database → Connection string** into `.env` as `DATABASE_URL`, run `pnpm run db:migrate`. Do not run local Postgres via Docker.

7. **CI**  
   If the `DATABASE_URL` repository secret is set (Supabase URI for a CI/dev database), the workflow runs `pnpm run db:migrate` after install. Fork PRs without the secret skip that step.

## Risks

- **Schema drift**: Mandatory migrations for every schema change; review on PRs.  
- **Secrets**: Never commit `DATABASE_URL`; never log connection strings.  
- **Supabase project hygiene**: Use a dedicated database or branch for CI if you want isolation from personal dev data.
