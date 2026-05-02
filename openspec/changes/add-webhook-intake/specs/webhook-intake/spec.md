# Webhook Intake

## Purpose

Securely receive Xero webhooks, deduplicate repeated deliveries, and hand accepted events to async processing.

## Requirements

### Requirement: Verify Xero webhook authenticity

The intake route MUST validate `x-xero-signature` using configured webhook secret and reject invalid requests.

#### Scenario: Invalid signature

- **WHEN** request signature is missing or invalid
- **THEN** response is `401`
- **AND** no webhook row is created.

### Requirement: Idempotent event recording

The system MUST store each unique raw webhook payload at most once.

#### Scenario: Duplicate delivery

- **WHEN** the same webhook payload is delivered multiple times
- **THEN** only one row is inserted in `webhook_events`
- **AND** later deliveries return duplicate acknowledgment.

### Requirement: Queue handoff when configured

The system MUST attempt queue publish after successful insert when queue env vars are available.

#### Scenario: Queue configured

- **WHEN** `QSTASH_TOKEN` is set (and public origin is inferable via `NEXTAUTH_URL`, `VERCEL_URL`, or localhost)
- **THEN** intake attempts publish to the process-event endpoint and returns `202`.
