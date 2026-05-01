# Notify Job

## Purpose

Deliver actionable account-diff notifications with durable dedupe semantics.

## Requirements

### Requirement: Persist dedupe digest before dispatch

The notify worker MUST persist a normalized digest key and skip outbound fan-out when that digest already exists.

#### Scenario: Duplicate actionable payload

- **WHEN** the worker receives an actionable payload with an existing digest key
- **THEN** response is `200`
- **AND** response status is `deduped`
- **AND** Teams and email channels are marked as skipped for duplicate digest.

### Requirement: Release dedupe claim when nothing delivers

When an actionable payload claims a digest but no channel succeeds, the worker MUST release the digest claim so retries can re-attempt delivery.

#### Scenario: No successful channel delivery

- **WHEN** Teams fails or skips and email fails or skips for an actionable payload
- **THEN** response status is `no-delivery`
- **AND** digest claim is removed for retry.

### Requirement: Process-event triggers notify worker

The process-event worker MUST invoke notify fan-out after snapshot persistence and include notify result in the response.

#### Scenario: Successful process-event execution

- **WHEN** process-event computes a diff and saves snapshot successfully
- **THEN** it invokes notify worker with tenant, source idempotency key, and diff
- **AND** response includes a `notify` result object.
