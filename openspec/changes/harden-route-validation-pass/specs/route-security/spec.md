# Route Security Hardening

## Purpose

Ensure critical API routes reject malformed requests early and avoid exposing sensitive backend error details in responses.

## Requirements

### Requirement: Enforce JSON content type on protected POST routes

Webhook intake, process-event, and snapshot sync routes MUST reject non-JSON request content types.

#### Scenario: Non-JSON POST request

- **WHEN** `POST /api/webhooks/xero`, `POST /api/jobs/process-event`, or `POST /api/admin/sync-snapshots` receives a request without `application/json` content type
- **THEN** the route returns `415`.

### Requirement: Reject oversized webhook payloads

Webhook intake MUST reject payloads exceeding configured safety thresholds.

#### Scenario: Payload too large

- **WHEN** `POST /api/webhooks/xero` receives a payload with `content-length` greater than the maximum allowed size
- **THEN** the route returns `413`
- **AND** signature verification is not attempted.

### Requirement: Strict body validation for internal processing routes

Internal process-event and snapshot sync routes MUST reject unknown or invalid JSON body fields.

#### Scenario: Unexpected field present

- **WHEN** `POST /api/jobs/process-event` or `POST /api/admin/sync-snapshots` receives extra fields outside expected schema
- **THEN** the route returns `400`.

### Requirement: Do not leak internal error details

Operational route failures MUST return generic error messages suitable for external clients.

#### Scenario: Database health probe fails

- **WHEN** `GET /api/health` encounters backend database failure
- **THEN** response status is `503`
- **AND** response body excludes raw backend exception details.
