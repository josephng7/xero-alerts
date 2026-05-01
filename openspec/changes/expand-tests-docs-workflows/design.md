# Design: tests/docs increment for implemented routes

## Test prioritization options considered

1. Route-focused first:
   - Add focused route tests per endpoint with strict mocks.
   - Pros: fast CI, precise failures, broad branch coverage.
   - Cons: weaker cross-route contract confidence.
2. Integration-heavy first:
   - Build end-to-end style route chaining tests.
   - Pros: stronger contract confidence.
   - Cons: higher runtime cost and brittle fixtures.

## Decision

Choose a hybrid weighted toward route-focused tests:

- Primary: route-focused tests for high-risk branches (queue handoff, tenant guard, no-op vs send).
- Secondary: one workflow-contract test to validate payload compatibility across webhook -> process-event -> notify.

This aligns with current risk profile (recent route additions and guard logic) while keeping CI runtime bounded.

## Docs approach

- Update README to remove stub-era statements and list current endpoint behavior.
- Add a concise pipeline runbook with triage/recovery steps and required env sets.
- Tighten existing runbooks with endpoint- and env-specific signals/actions.
