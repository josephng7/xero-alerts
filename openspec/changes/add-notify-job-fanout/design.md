# Design: notify job fan-out

## Input contract

- Method: `POST /api/jobs/notify`
- Body:
  - `tenantId: string`
  - `idempotencyKey?: string`
  - `diff` object with `added`, `removed`, `changed`, and summary counts

## Processing flow

1. Validate request payload shape.
2. Evaluate diff summary for actionable changes.
3. If no changes, return `200` with `status: "no-op"` and channel skip reasons.
4. Build concise message content for Teams and email.
5. Attempt Teams send when webhook URL is configured.
6. Attempt email send when all required email env vars are configured.
7. Return `200` with channel delivery statuses (`sent`, `skipped`, or `failed`).

## Notes

- This iteration intentionally uses simple `fetch` calls and does not persist notification state.
- Channel errors are captured in response payload to keep the endpoint robust for queue retries and observability.
