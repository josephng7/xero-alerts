# Design: route security hardening pass

## Scope

This pass targets already-implemented routes:

- `POST /api/webhooks/xero`
- `GET /api/oauth/callback`
- `POST /api/jobs/process-event`
- `POST /api/admin/sync-snapshots`
- `GET /api/health`

## Validation strategy

1. **Content type checks**
   - Reject POST requests that are not `application/json` with `415`.
   - Apply to webhook intake, process-event, and snapshot sync.

2. **Payload guardrails**
   - Reject webhook requests larger than a conservative limit (`256KB`) when `content-length` indicates oversized body.

3. **Strict body shape checks**
   - Use strict schema parsing for process-event and snapshot sync.
   - Reject unknown fields and empty/invalid required values with `400`.

4. **Safer error surfaces**
   - Log internal errors server-side.
   - Return generic failure strings in 500/503 responses to avoid leaking internals.

## Compatibility notes

- Existing valid clients already sending JSON are unaffected.
- Status code behavior for successful requests remains unchanged.
- Error responses become stricter only for malformed or suspicious inputs.
