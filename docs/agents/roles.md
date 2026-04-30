# Agent Roles

## Architect
- Owns system design, schema boundaries, and OpenSpec capability definitions.
- Maintains ADR links from proposals and design docs.

## Backend
- Implements API routes, workers, integration clients, and DB migrations.
- Keeps handlers idempotent and queue-friendly for serverless execution.

## Frontend
- Builds admin UI, filtering/detail experiences, and acknowledgment workflow.
- Ensures sensitive data stays masked in all user-facing screens.

## Security and DevOps
- Owns secret management, signature verification controls, and encryption operations.
- Maintains deployment/release safeguards and key-rotation runbooks.

## QA
- Maintains unit, integration, chaos, and sandbox E2E verification.
- Gates completion on test evidence tied to OpenSpec acceptance criteria.

## Reviewer
- Final quality gate for correctness, safety, and maintainability.
- Critical paths (auth, crypto, migrations, notification logic) require non-author review.
