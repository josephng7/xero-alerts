# 0001: Worktree Structure and Conventions

## Context
Development involves parallel feature work, review, and potentially multiple coding agents. Branch switching in a single checkout increases context bleed risk and slows iteration.

## Decision
Use a parent folder layout where `main` is the trunk checkout and feature branches run in dedicated worktrees.

- Parent container: `c:\github\xero-alerts\`
- Trunk checkout: `c:\github\xero-alerts\main\`
- Feature worktrees: `c:\github\xero-alerts\worktrees\feat-<change-id>\`

Create feature worktrees from trunk with:

`git worktree add ..\worktrees\feat-<change-id> -b feat/<change-id>`

## Alternatives Considered
- Single checkout with frequent branch switching.
- Multiple full clones per branch.

## Consequences
- Better isolation for concurrent work and local artifacts.
- Slightly higher disk usage than single-checkout development.
