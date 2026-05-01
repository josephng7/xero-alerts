# Add minimal UI backlog baseline

## Why

The project currently has API and persistence scaffolding but no operational UI surface for basic visibility into webhook intake and snapshot freshness. A thin baseline UI helps validate workflow shape before investing in full design.

## What changes

- Replace the placeholder home page with a minimal dashboard that renders:
  - latest webhook processing timestamp
  - latest snapshot summary
  - recent webhook event rows with basic status
- Add placeholder alert detail page with acknowledgement affordance wired to `POST /api/alerts/[id]/ack`.
- Keep interactions lightweight and compatible with current 501 alert routes.
- Add focused helper tests for UI baseline data shaping.

## Impact

- Delivers an audit-ready UI skeleton without changing existing backend contracts.
- Keeps scope low-risk and non-breaking while unblocking future detail/read-model work.
