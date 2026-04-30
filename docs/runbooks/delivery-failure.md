# Delivery Failure Runbook

## Signals
- Teams or email notifications fail repeatedly.
- `alert_deliveries` records show persistent channel errors.

## Immediate Actions
1. Check upstream provider status pages (Teams webhook and Resend).
2. Validate webhook/API credentials and sender configuration.
3. Confirm queue retries are still active.

## Recovery
1. Fix invalid credentials or destination configuration.
2. Requeue failed notifications where possible.
3. Verify successful delivery on both channels.

## Post-Incident
- Document the incident in the execution logbook.
- Tune retry policy or fallback behavior if needed.
