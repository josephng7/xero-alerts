# Design: UI backlog baseline

## Data approach

- Use **server components** for dashboard reads from persistence (`webhook_events`, `account_snapshots`) to keep data loading colocated with rendering and avoid introducing new client state infrastructure.
- Use a **small client component** only for the acknowledgement button to call existing `POST /api/alerts/[id]/ack`.

## Dashboard structure

1. Fetch latest snapshot row and 10 most recent webhook rows.
2. Derive minimal display fields:
   - snapshot account count from payload
   - webhook status as `received` or `untyped`
3. Render plain semantic sections/table with link to alert detail placeholder route.

## Detail structure

- Route: `/alerts/[id]`.
- Show placeholder alert identity and context text.
- Include acknowledgement button wired to `/api/alerts/[id]/ack`.
- Surface route response message so current `501` behavior is visible and testable manually.

## Risks and limits

- No full alert read model yet; detail page is intentionally placeholder-only.
- Dashboard event status is heuristic until dedicated processing state exists.
