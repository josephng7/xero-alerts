# Operations

## ADDED Requirements

### Requirement: Go-live operator checklist exists

The system MUST provide a dedicated go-live runbook that enumerates required environment variables (database, Xero, encryption, split internal secrets, QStash, Teams, Resend), the recommended order of operations (migrations before OAuth and webhook registration), and practical safety checks before accepting full traffic.

#### Scenario: Operator prepares production deployment

- **WHEN** an operator opens the go-live runbook
- **THEN** they can configure `DATABASE_URL`, Xero OAuth and webhook keys, `TOKEN_ENCRYPTION_KEY`, `INTERNAL_ADMIN_SECRET` and `INTERNAL_CRON_SECRET`, optional QStash and notification variables
- **AND** they can follow migrations, OAuth connect, and Xero webhook URL steps in a safe sequence.

### Requirement: Regression test exercises QStash and Xero fetch headers

The system MUST maintain an automated test that runs real queue publish and account-fetch modules against stubbed HTTP, validating bearer tokens and enqueue payload fields while completing the process-event success path.

#### Scenario: Workflow test executes with mocked fetch

- **WHEN** CI runs the workflow fetch integration test
- **THEN** webhook intake triggers a QStash publish call whose headers and body match the configured secrets and recorded event identifiers
- **AND** process-event performs an Xero Accounts request with a bearer access token and persists mapped bank accounts.
