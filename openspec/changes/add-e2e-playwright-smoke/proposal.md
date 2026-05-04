# Add Playwright E2E smoke tests

## Why

Vitest covers routes and contracts; we lack a minimal browser-level check that the production server renders the dashboard and `/api/health` responds with the expected JSON shape.

## What changes

- Add `@playwright/test`, `playwright.config.ts`, and `e2e/smoke.spec.ts` (home heading + health API).
- CI runs Chromium install + `pnpm run test:e2e` after build.

## Impact

- Catches regressions in SSR/home rendering and health routing without manual clicks.
