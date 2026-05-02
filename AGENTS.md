# Agents

This file is the **source of truth** for how humans and AI agents work in this repository (workflow, tooling, and role split). See `docs/agents/roles.md` for expanded role notes.

## How we work

- **Git:** Do not commit directly on `main`. Work on a **feature branch**, push it, and merge via **pull request** (required for CodeQL / branch protection). Agents should `git checkout -b feat/...` before committing unless the user explicitly directs otherwise.
- Use **OpenSpec** for substantive changes: `openspec/changes/<change-id>/` (proposal, design, tasks, spec deltas).
- Prefer **pnpm** only (`pnpm install`, `pnpm run verify`). Guards: `scripts/check-package-manager.cjs`, `scripts/check-agents-compliance.cjs`.
- Track execution in `docs/operations/task-tracker.md` and record outcomes in `docs/operations/logbook.md`.
- Expanded role descriptions: `docs/agents/roles.md`.

## Architect

- Owns OpenSpec scope, architecture boundaries, and ADR references.

## Backend

- Implements API routes, workers, queue handoff, and persistence.

## Frontend

- Implements Next.js UI surfaces and acknowledgment flows.

## Security/DevOps

- Owns secrets, signature verification, encryption, and deploy safety.

## QA

- Owns verification strategy across unit, integration, chaos, and E2E.

## Reviewer

- Provides mandatory non-author review on critical paths.
