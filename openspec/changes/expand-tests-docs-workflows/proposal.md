# Expand tests and operator docs for workflow routes

## Why

Core routes are now implemented, but regression coverage is still uneven and operator docs still partially describe scaffold/stub-era behavior.

## What changes

- Add high-value route tests for:
  - Webhook intake queue/duplicate paths.
  - Process-event tenant guard and success path.
  - Notify route no-op and actionable fanout.
  - Admin sync tenant guard.
- Add one workflow-contract test for webhook -> process-event -> notify payload compatibility.
- Update README and runbooks to reflect real route behavior and env requirements.

## Impact

- Reduces risk of breaking queue handoff and worker contracts.
- Improves incident response speed with concise, current runbooks.
