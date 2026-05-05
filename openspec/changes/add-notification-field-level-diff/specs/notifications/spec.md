# Delta spec: Notifications — field-level bank/contact changes

## ADDED Requirements

### Structured diff in notification payload

- **WHEN** a notify job runs after **`process-event`** with bank snapshot comparison  
- **THEN** the payload MUST include enough structured data to identify **each affected contact** (at minimum **contact id** and **display name**) and **each changed bank line** (stable **line key** or **bank account id**).  
- **AND** for lines classified as **changed**, the payload MUST list **which fields** differ among the comparable attributes (including but not limited to **contact name**, **bank account label**, **BSB**, **account number**, **normalized bank reference**), with **previous** and **current** values suitable for operator review **subject to masking policy**.

### Channel formatting

- **WHEN** Teams and/or email notifications are sent  
- **THEN** message bodies MUST present **per-contact** (or per-line) detail derived from that structured diff, not **counts alone**.  
- **AND** MUST apply **masking** to sensitive banking identifiers in email and Teams content according to repository security conventions.  
- **AND** MUST enforce **maximum message size** with explicit truncation (e.g. “further changes omitted”) rather than failing delivery.

### Dedupe behaviour

- **WHEN** the same logical change set would be notified twice  
- **THEN** deduplication MUST still prevent duplicate digests; the digest input MUST incorporate **canonical structured diff content** (versioned), not merely counts.

### Alert parity

- **WHEN** an alert row is created for an actionable diff  
- **THEN** the stored **`diff`** JSON MUST support the same structured detail as the notify payload for that event (same schema version), so UI and channels stay consistent.

## MODIFIED Requirements

- **REPLACE** “notifications may contain only aggregate added/removed/changed **counts**” with the structured requirements above for **production** deployments using schema version **≥ 2** (exact version constant defined at implementation).

## Compatibility

- **WHEN** reading historical alerts or replaying old jobs  
- **THEN** the system MUST accept **legacy** diff payloads (line-key arrays + summary only) and render **best-effort** summaries without crashing.
