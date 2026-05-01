# Persistence baseline

## Purpose

Versioned relational storage for Xero alerts: tenants, credentials, webhook intake, and related pipeline state.

## Requirements

### Requirement: Postgres as system of record

The application MUST use PostgreSQL for durable relational data in production and documented local development.

#### Scenario: Documented connection

- **WHEN** a developer configures `DATABASE_URL` per `.env.example`
- **THEN** the application can open a pooled or direct connection suitable for serverless or long-running runtimes as documented.

### Requirement: Versioned schema migrations

All schema changes MUST be applied through checked-in migrations that can run from a clean database to the latest version without manual SQL.

#### Scenario: Fresh database

- **WHEN** migrations are applied to an empty Postgres instance
- **THEN** they complete successfully and match the expected current schema.

### Requirement: MVP tables for pipeline foundations

The schema MUST include tables (names may vary by implementation) sufficient for:

- Associating Xero tenant identifiers with internal org records.
- Storing OAuth token material encrypted at rest and supporting refresh coordination.
- Recording webhook deliveries for deduplication or idempotent processing.

#### Scenario: Idempotent intake

- **WHEN** the same webhook event identifier is stored more than once
- **THEN** the data model supports detecting duplicates without corrupting state (exact constraint defined in migration).

### Requirement: No plaintext OAuth secrets

Access and refresh tokens MUST NOT be stored in plaintext in the database.

#### Scenario: At-rest token row

- **WHEN** token material is persisted
- **THEN** it uses the application’s encryption helpers (e.g. AES-GCM) or an equivalent approved mechanism.
