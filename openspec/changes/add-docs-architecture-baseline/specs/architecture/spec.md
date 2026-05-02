# Architecture documentation (baseline)

## Requirement

The repository SHALL maintain a **`docs/architecture/`** section that provides:

1. **Index** — Explains relationship to OpenSpec and runbooks and lists architecture documents.
2. **Data and platform workflow** — Diagrams of external platforms, primary Postgres tables (overview), and main runtime flows (webhook → process → notify, OAuth, cron/admin paths).
3. **Trust and secrets** — Summary of authentication boundaries (Xero webhook signature, internal cron vs admin secrets, token encryption role) with references to procedural runbooks for rotation and go-live.

## Out of scope for this capability

- Duplicating full environment variable tables (defer to `.env.example` and `docs/runbooks/go-live.md`).
- Replacing OpenSpec capability specs or ADRs in `docs/decisions/`.
