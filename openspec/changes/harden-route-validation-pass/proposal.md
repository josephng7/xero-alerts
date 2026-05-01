# Harden route validation and error exposure

## Why

Current route implementations are functional but still accept loosely shaped inputs and can expose internal error detail in some failure responses. A small hardening pass reduces abuse surface without changing route contracts.

## What changes

- Enforce `application/json` content type for webhook intake and JSON POST worker/admin endpoints.
- Add payload size guardrails for webhook intake using `content-length`.
- Add strict request-body validation for process-event and snapshot sync routes.
- Replace internal error leakage in operational routes with generic 500/503 response messages.

## Impact

- Requests with invalid content type, oversized payloads, or unexpected body fields are rejected early with stable status codes.
- Sensitive backend error details are no longer reflected to API callers.
- Existing successful route flows and response shapes remain compatible.
