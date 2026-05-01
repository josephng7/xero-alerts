# Process Event

## Purpose

Process stored webhook events into current account-state diffs and refreshed snapshots.

## Requirements

### Requirement: Process stored event by identifier

The worker endpoint MUST load a previously stored webhook event by ID or idempotency key and reject missing references.

#### Scenario: Unknown event identifier

- **WHEN** request references a non-existent event
- **THEN** response is `404`.

### Requirement: Compute diff between previous and current account snapshots

The worker MUST compare latest Xero BANK accounts against stored snapshot and return added/removed/changed summaries.

#### Scenario: Changed account set

- **WHEN** current account set differs from previous snapshot
- **THEN** response includes non-zero diff counts and account id lists for changed categories.

### Requirement: Persist refreshed snapshot

After processing, the worker MUST upsert the tenant's current snapshot.

#### Scenario: Successful processing

- **WHEN** webhook event processing completes
- **THEN** snapshot payload is updated for the tenant in `account_snapshots`.
