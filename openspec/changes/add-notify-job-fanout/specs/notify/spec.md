# Notify Job

## Purpose

Deliver minimal change notifications for processed tenant account diffs.

## Requirements

### Requirement: No-op when diff has no actionable changes

The notify endpoint MUST skip outbound delivery when added, removed, and changed counts are all zero.

#### Scenario: Empty diff summary

- **WHEN** a notify request includes zero counts for added, removed, and changed
- **THEN** response is `200`
- **AND** response status is `no-op`
- **AND** Teams and email channels are marked as skipped.

### Requirement: Teams send when configured

The notify endpoint MUST attempt Teams webhook delivery when actionable changes exist and `TEAMS_WEBHOOK_URL` is configured.

#### Scenario: Teams webhook configured

- **WHEN** actionable changes are present and Teams webhook URL exists
- **THEN** notify worker posts a concise Teams message
- **AND** response includes Teams channel status result.

### Requirement: Email gating and explicit skip

The notify endpoint MUST only attempt email delivery when `RESEND_API_KEY`, `ALERTS_FROM_EMAIL`, and `ALERTS_TO_EMAIL` are all configured.

#### Scenario: Missing email configuration

- **WHEN** actionable changes are present but at least one required email env var is missing
- **THEN** response remains `200`
- **AND** email channel status is `skipped` with an explicit reason.
