# Design: go-live docs and fetch workflow test

## Documentation

- Keep operator docs ASCII-only and consistent with `lib/env.ts` (split `INTERNAL_ADMIN_SECRET` / `INTERNAL_CRON_SECRET`, not a legacy single secret name).
- Cross-link existing pipeline and rotation runbooks instead of duplicating triage steps.

## Testing strategy

- Reuse Vitest hoisted mocks for persistence and tenant token plumbing.
- Avoid mocking `@/lib/queue/qstash` and `@/lib/xero/accounts` so real modules run.
- Stub `globalThis.fetch` with URL branching:
  - Paths containing `/v2/publish/` assert QStash bearer token and JSON body matching webhook enqueue payload.
  - `api.xero.com` paths assert `Authorization: Bearer <token>` from mocked `getTenantAccessToken`.
- Keep `runNotifyJob` mocked so the test stays focused on webhook-to-fetch pipeline boundaries.
