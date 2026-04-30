# Design: Bootstrap Next.js Scaffold

## Scope
This change provides only baseline app/runtime setup. It intentionally avoids implementing business logic (webhooks, OAuth, jobs, persistence).

## Decisions
- Use Next.js App Router with TypeScript.
- Keep directory structure simple and explicit (`app/`, `lib/`).
- Provide `app/api/health/route.ts` for basic readiness checks.
- Include `.env.example` for required integration keys.

## Non-Goals
- No DB migrations yet.
- No queue/job routes yet.
- No auth flows yet.
