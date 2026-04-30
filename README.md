# xero-alerts

## Process Setup

This repository starts with process scaffolding before feature implementation:

- OpenSpec framework in `openspec/`
- Role definitions in `docs/agents/roles.md`
- ADR-lite decision log in `docs/decisions/`
- Worktree/development workflow in `docs/process/workflow.md`
- CI checks in `.github/workflows/ci.yml`
- PR review checklist in `.github/pull_request_template.md`

## Worktree Convention

Use a parent folder layout and create feature worktrees from `main`:

`git worktree add ..\worktrees\feat-<change-id> -b feat/<change-id>`
