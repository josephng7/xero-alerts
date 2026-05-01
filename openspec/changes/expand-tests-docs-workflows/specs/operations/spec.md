# Operations

## Purpose

Keep route-level regressions and operator guidance aligned with implemented webhook-processing behavior.

## Requirements

### Requirement: Implemented workflow routes are regression tested

The system MUST maintain automated tests that cover critical branches for webhook intake, process-event processing, notify fanout, and tenant guards.

#### Scenario: Critical route branches are validated

- **WHEN** CI executes the test suite
- **THEN** tests validate queue handoff and duplicate behavior for webhook intake
- **AND** tests validate process-event success path and tenant guard rejection
- **AND** tests validate notify no-op and actionable send branches.

### Requirement: Cross-route payload contracts remain compatible

The system MUST verify payload compatibility from webhook intake to process-event and notify routes.

#### Scenario: Workflow contract test executes

- **WHEN** webhook intake enqueues payload consumed by process-event
- **THEN** process-event request shape is accepted
- **AND** process-event response diff is accepted by notify payload schema.

### Requirement: Operator docs reflect current behavior and env requirements

The repository MUST provide concise operator-facing docs for current route behavior and runtime env requirements.

#### Scenario: Operator references docs

- **WHEN** an operator reviews README and runbooks
- **THEN** they can identify required env vars and expected route outcomes for triage and recovery.
