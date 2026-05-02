# Architecture documentation

This folder holds **stable, diagram-first views** of how the system fits together: platforms, data flow, and trust boundaries.

It **does not** replace:

- **OpenSpec** (`openspec/specs/`, `openspec/changes/<id>/`) — normative capability specs and change deltas.
- **Runbooks** (`docs/runbooks/`) — procedures (deploy, rotation, triage).

When behavior changes materially, update the relevant **OpenSpec** artifacts first (or in the same PR), then adjust diagrams here so they stay accurate.

## Contents

| Doc | Purpose |
| --- | ------- |
| [`data-and-platform-workflow.md`](./data-and-platform-workflow.md) | External platforms, Postgres tables (overview), and main runtime flows. |
| [`trust-and-secrets.md`](./trust-and-secrets.md) | Who validates whom (Xero HMAC, internal secrets, token encryption, optional tenant guard). |

## When to update

- After changing integration points (new queue provider, new notify channel, auth split).
- After reshaping the webhook → worker → notify pipeline.
- When onboarding reviewers who need a single place for context before reading runbooks.

## Related links

- Env and cutover: [`docs/runbooks/go-live.md`](../runbooks/go-live.md)
- Internal route secrets: [`docs/runbooks/internal-api-secret-rotation.md`](../runbooks/internal-api-secret-rotation.md)
- Webhook pipeline triage: [`docs/runbooks/webhook-pipeline.md`](../runbooks/webhook-pipeline.md)
- OpenSpec layout: [`openspec/README.md`](../../openspec/README.md)
