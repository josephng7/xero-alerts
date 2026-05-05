# Design: Field-level diff for alerts and notifications

## Current behaviour (baseline)

- **`diffBankAccountSnapshots`** (`lib/alerts/diff-accounts.ts`): compares **`LineDigest`** per **`lineKey`**; **`changed`** only records **`lineKey`** when any of contact name, bank account name, BSB, account number, or normalized ref differ.
- **`NotificationDiff`** (`lib/notifications/logic.ts`): **`added` / `removed` / `changed`** are **`string[]`** of **`lineKey`** only; **`summary`** holds counts.
- **Alerts** store **`diff`** JSON; **notify** uses same payload shape.

## Target shape (conceptual)

Introduce a versioned payload, e.g. **`diffSchemaVersion: 2`**, alongside legacy **`added`/`removed`/`changed` arrays** for backward compatibility during migration, or bump schema with a **single** migration window — decision in implementation tasks.

### Minimum rich content per **added** line

- **`lineKey`**, **`contactId`**, **`contactName`**
- **`bank`**: display name, BSB, account number (masked in notifications per policy)

### Minimum rich content per **removed** line

- Same identifiers as stored on previous snapshot (from prior digest).

### Minimum rich content per **changed** line

- Identifiers as above.
- **`fieldChanges`**: array of `{ field, previous, current }` for comparable columns (e.g. `contactName`, `bankAccountName`, `bsb`, `accountNumber`, `normalizedBankRef` — exact set locked in spec).
- Values in notifications: **masked** where applicable; optional **hash or last-four** only for numbers.

### Summary block

- Retain **`summary`** counts for headlines and dedupe stability.
- Optionally add **`summary.maskedDigest`** for dedupe if line-level JSON ordering varies.

## Computation

- Extend **`diffBankAccountSnapshots`** (or add **`diffBankAccountSnapshotsDetailed`**) to:
  - For **added**/**removed**: attach snapshot row metadata already available from **`XeroContactBankLineSnapshot`**.
  - For **changed**: pairwise compare **`digest`** fields and emit **`fieldChanges`** only for fields that differ.

## Notifications

- **`formatTeamsMessage`** / **`formatEmailHtmlMessage`**: render sections **Added / Removed / Changed**, nested under **contact name + contact id**, then **field rows** for changes.
- Enforce **max length**: truncate with “**N further changes omitted**”; link or reference **alert id** when possible.

## Alerts UI

- **`app/alerts/[id]/page.tsx`**: render structured diff (tables or lists); optional **unmasked** view only if acceptable under security review.

## Dedupe (`notify_dispatches`)

- Recompute **`dedupeKey`** input from **canonical serialized** diff (version + tenant + sorted keys) so duplicate webhook retries do not spam when content is identical.

## Migration

- Existing alerts keep **v1** JSON; readers accept **v1** and **v2**.
- New processing emits **v2** only after release cut.

## Testing

- Unit tests: field-level diff for single-field vs multi-field changes; masking helpers.
- Contract tests: **`notifyPayloadSchema`** (zod) updated; **`process-event`** integration expectations updated.
