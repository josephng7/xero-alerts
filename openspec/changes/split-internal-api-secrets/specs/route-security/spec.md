# Route Security: Split Internal Secrets (delta)

## Purpose

Increment hardening from a single internal secret to role-scoped secrets with optional dual-key rotation.

## Requirements

### Requirement: Cron internal routes use cron secret

`POST /api/cron/poll-org-accounts` MUST validate `x-internal-api-secret` against `INTERNAL_CRON_SECRET` or, when set, `INTERNAL_CRON_SECRET_PREVIOUS`.

#### Scenario: Cron route rejects admin secret

- **WHEN** the route is called with a header matching only `INTERNAL_ADMIN_SECRET`
- **THEN** the route returns `403`.

### Requirement: Admin and job internal routes use admin secret

`POST /api/admin/sync-snapshots`, `POST /api/jobs/process-event`, and `POST /api/jobs/notify` MUST validate `x-internal-api-secret` against `INTERNAL_ADMIN_SECRET` or, when set, `INTERNAL_ADMIN_SECRET_PREVIOUS`.

#### Scenario: Admin route rejects cron secret

- **WHEN** the route is called with a header matching only `INTERNAL_CRON_SECRET`
- **THEN** the route returns `403`.

### Requirement: Misconfigured primary secret fails safely

#### Scenario: Cron secret not configured

- **WHEN** `INTERNAL_CRON_SECRET` is missing at runtime on a cron route
- **THEN** the route returns `500`
- **AND** response body does not expose sensitive implementation details.

#### Scenario: Admin secret not configured

- **WHEN** `INTERNAL_ADMIN_SECRET` is missing at runtime on an admin/job route
- **THEN** the route returns `500`
- **AND** response body does not expose sensitive implementation details.

### Requirement: Legacy single secret removed

`INTERNAL_API_SECRET` MUST NOT be used for internal route authentication (removed from env parsing).
