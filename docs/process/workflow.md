# Development Process

## Workflow
1. Create or update an OpenSpec change under `openspec/changes/<change-id>/`.
2. Implement on `feat/<change-id>` branch (prefer worktree).
3. Verify locally (typecheck, lint, tests, build).
4. Open PR with linked OpenSpec change and verification notes.
5. Merge only after required review checks pass.

## Branch Naming
- `feat/<change-id>`
- `fix/<scope>`
- `chore/<scope>`

## Required Review Areas
Mandatory non-author review for:
- Auth/session logic
- Crypto/signature verification
- Data model migrations
- Notification delivery logic
