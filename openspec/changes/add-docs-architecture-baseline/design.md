# Design: architecture docs baseline

## Placement

- **`docs/architecture/`** — durable diagrams and trust summaries.
- **Canonical behavior** remains in **`openspec/specs/`** (when synced) and **code**; **procedures** remain in **`docs/runbooks/`**.

## Content rules

- Prefer **links** to runbooks for rotation and deployment steps.
- Diagrams use **Mermaid** in markdown for version control and PR review.
- Table overview for Drizzle entities references **`lib/db/schema.ts`** as source of truth.

## Maintenance

Update architecture docs when integration topology or auth splits change; pair with OpenSpec change when the delta is substantive.
