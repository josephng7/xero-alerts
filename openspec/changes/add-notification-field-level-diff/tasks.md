# Tasks: add-notification-field-level-diff

## Phase 1 — Types & diff engine

- [ ] Define **`NotificationDiffV2`** (name TBD) with **`diffSchemaVersion`**, **`summary`**, **`lines.added` / `lines.removed` / `lines.changed`** including **`fieldChanges`** where applicable.
- [ ] Implement detailed comparison in **`lib/alerts/diff-accounts.ts`** (extend or add parallel function); preserve **`summary`** counts compatible with **`isActionableDiff`**.
- [ ] Add Vitest coverage for added/removed/changed + multi-field change on same line.

## Phase 2 — Persistence & jobs

- [ ] Update **`createAlertFromProcessEventDiff`** and **`alerts`** JSON column expectations (no DB migration if JSON only; else document).
- [ ] Extend **`notifyPayloadSchema`** in **`lib/jobs/notify.ts`** for v2 shape; keep **backward compatibility** for tests until cutover.
- [ ] Wire **`process-event`** to emit v2 diff once stable.

## Phase 3 — Notification channels

- [ ] Implement **`formatTeamsMessage`** / **`formatEmailHtmlMessage`** for v2 (sections, masking, truncation).
- [ ] Integrate **`lib/masking`** (or extend) for BSB/account number in outbound text.
- [ ] Subject line: include short summary + tenant; avoid raw PAN-like data.

## Phase 4 — Dedupe & ops

- [ ] Align **`recordNotifyDispatchIfNew`** / digest input with v2 canonical serialization.
- [ ] Update **`docs/runbooks/delivery-failure.md`** (what operators see in Teams/email).
- [ ] Update **`docs/runbooks/go-live.md`** notification expectations one paragraph.

## Phase 5 — UI

- [ ] Update **`app/alerts/[id]/page.tsx`** (and dashboard cards if needed) to render v2 diff readably.
- [ ] Keep v1 alert rows readable (fallback rendering).

## Phase 6 — Cleanup

- [ ] Remove v1-only code paths once production migrated (optional follow-up change).
