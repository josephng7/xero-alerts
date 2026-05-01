# UI Baseline

## Purpose

Provide a minimal operations-facing UI skeleton for webhook/snapshot visibility and placeholder acknowledgement flow.

## Requirements

### Requirement: Dashboard baseline visibility

The home dashboard MUST display latest processing and snapshot summary plus a recent webhook event list.

#### Scenario: Dashboard loads with persisted data

- **WHEN** a user opens `/`
- **THEN** the page shows latest webhook received timestamp
- **AND** latest snapshot fetched timestamp/source/account count
- **AND** a list of recent webhook events with basic status.

### Requirement: Placeholder alert detail route

The system MUST provide a placeholder alert detail page route aligned to future alert IDs.

#### Scenario: Open placeholder detail

- **WHEN** a user opens `/alerts/{id}`
- **THEN** the page renders placeholder alert details for `{id}`
- **AND** includes an acknowledgement affordance.

### Requirement: Acknowledgement affordance uses existing route shape

The alert detail acknowledgement affordance MUST call the existing route shape `POST /api/alerts/{id}/ack`.

#### Scenario: Trigger acknowledgement

- **WHEN** a user clicks acknowledge on `/alerts/{id}`
- **THEN** the client sends `POST /api/alerts/{id}/ack`
- **AND** surfaces the returned response message to the user.
