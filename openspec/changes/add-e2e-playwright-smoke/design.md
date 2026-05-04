## Configuration

- **Port:** `3100` (avoids clashing with `next dev` on 3000).
- **webServer:** `next start` against prior `next build` output; CI runs build before E2E.
- **Health assertion:** Accept `200` (DB ok) or `503` (degraded) so forks without `DATABASE_URL` still pass; always expect `service: "xero-alerts"`.

## Local setup

First-time: `pnpm exec playwright install chromium` (CI uses `playwright install --with-deps chromium`).
