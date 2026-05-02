# alerts

## ADDED Requirements

### Requirement: persistence

The system SHALL persist alerts in Postgres with organization scope, optional link to a webhook event, JSON diff payload, and nullable acknowledgement time. Row-level security SHALL allow `service_role` full access consistent with other application tables.

### Requirement: list and detail APIs

The system SHALL expose `GET /api/alerts` returning a JSON object with `items` and `nextCursor`, supporting optional `tenantId`, `limit`, and `cursor` query parameters. The system SHALL expose `GET /api/alerts/[id]` for a single alert. Both routes SHALL require admin internal authentication and SHALL honor `XERO_ALLOWED_TENANT_ID` when configured.

### Requirement: acknowledgement API

The system SHALL expose `POST /api/alerts/[id]/ack` that marks an alert acknowledged and SHALL return success without error if already acknowledged (idempotent).

### Requirement: alert creation from processing

When `POST /api/jobs/process-event` computes an actionable bank-account diff for a tenant with an organization row, the system SHALL insert or retain at most one alert per webhook event linked to that processing run.

### Requirement: dashboard visibility

The dashboard SHALL list recent alerts and SHALL provide a detail view with acknowledgement, using server-side integration with the alert APIs or equivalent server-only access patterns documented for MVP.
