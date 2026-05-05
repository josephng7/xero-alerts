# Delta spec: Alerts — stored diff matches notification detail

## ADDED Requirements

### Alert `diff` JSON schema version

- **WHEN** an alert is created from **`process-event`** with actionable bank-detail changes  
- **THEN** the **`alerts.diff`** JSON MUST use the **same schema version and structured content** as passed to **`runNotifyJob`** for that webhook event (see **`specs/notifications/spec.md`** in this change).  
- **AND** the alert detail UI MUST render **structured** added/removed/changed information (at minimum contact identity and field-level changes for **changed** lines), with masking consistent with notifications unless an authenticated **unmasked** policy is explicitly approved.

### Legacy alerts

- **WHEN** listing or displaying alerts created before this change  
- **THEN** the UI MUST support **legacy** diff payloads (summary + line-key arrays only) without error.
