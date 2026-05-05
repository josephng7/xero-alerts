# Proposal: Field-level contact/bank change detail in notifications

## Problem

Production operators require notifications to answer **which contact** and **what changed** (field-level), not only aggregate counts of added/removed/changed bank-detail lines. Today **`diffBankAccountSnapshots`** marks a whole **line** as changed when any attribute differs, and Teams/email templates only surface **counts** (`lib/notifications/formatting.ts`).

## Change

- Extend the diff model produced after snapshot comparison to include **structured, field-level** deltas per bank line (contact identity + optional before/after per field).
- Persist the richer shape on **alerts** and pass it through **`runNotifyJob`** unchanged for consistency.
- Update **Teams** and **email** formatters to render human-readable lists with **masking** for sensitive values and **truncation** for channel limits.
- Keep **dedupe** semantics compatible (digest should incorporate normalized change content per agreed rules).

## Non-goals

- Changing Xero fetch scope or webhook intake (unless required for extra fields).
- Replacing the normalized OAuth credentials model (separate change: `refactor-xero-oauth-credentials-multitenant`).

## Security

- Apply existing masking patterns for bank identifiers in notification bodies; avoid raw secrets in email subject lines.
- Full unmasked detail may remain **authenticated UI only** if policy dictates.

## Timing

Post–live-demo production hardening; implement after demo unless escalated.
