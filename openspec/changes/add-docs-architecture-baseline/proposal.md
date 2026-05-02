# Add baseline architecture documentation

## Summary

Introduce `docs/architecture/` with a minimal set of diagrams and trust-boundary notes so reviewers and operators have a single orientation layer distinct from OpenSpec specs and procedural runbooks.

## Motivation

- Runbooks answer **how** to operate; OpenSpec answers **what** we committed to build.
- A thin **architecture** layer reduces onboarding friction and keeps platform/data-flow mental models consistent without duplicating migration SQL or env tables.

## Scope

- `docs/architecture/README.md` — purpose, boundaries vs OpenSpec/runbooks, index.
- `docs/architecture/data-and-platform-workflow.md` — Mermaid diagrams + persistence overview table.
- `docs/architecture/trust-and-secrets.md` — callers, headers, secret classes; pointers to runbooks.

## Non-goals

- Replacing `docs/runbooks/go-live.md` or OpenSpec capability specs.
- Exhaustive C4 or threat modeling.
