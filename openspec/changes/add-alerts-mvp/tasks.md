# Tasks: Alerts MVP

- [x] Add Drizzle schema + migration `0004_alerts.sql`, journal entry, RLS policy for `service_role`.
- [x] Implement `lib/db/alerts.ts` (create from process-event diff, list, get by id, acknowledge).
- [x] Implement `GET /api/alerts`, `GET /api/alerts/[id]`, `POST /api/alerts/[id]/ack` with admin internal auth and tenant guard.
- [x] Insert alert from `process-event` when diff is actionable.
- [x] Wire `app/page.tsx`, `app/alerts/[id]/page.tsx`, server action + ack form.
- [x] Add Vitest coverage for alert routes and extend process-event test for `alert` payload.
- [x] Run `pnpm run verify`.
