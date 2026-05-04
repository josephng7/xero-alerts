# Proposal: QStash pipeline observability and admin smoke test

## Problem

Operators could not confirm QStash publish from production using only Xero webhooks, and Vercel logs lacked structured insight into enqueue vs delivery failures.

## Change

- Add `PIPELINE_DEBUG=1` gated `[pipeline]` logs across webhook intake, QStash publish, and `process-event` entry (no secret values).
- Add `POST /api/admin/test-qstash-enqueue` (admin-authenticated) to publish a QStash message to a dedicated smoke callback `POST /api/admin/qstash-smoke`, reusing the same publish helper as webhook enqueue.
- Refactor `lib/queue/qstash.ts` to expose `publishQstashJob` for arbitrary destinations while keeping `enqueueProcessEventJob` behavior unchanged.

## Security

Both new admin routes require `x-internal-api-secret` matching `INTERNAL_ADMIN_SECRET`, consistent with other admin endpoints.
