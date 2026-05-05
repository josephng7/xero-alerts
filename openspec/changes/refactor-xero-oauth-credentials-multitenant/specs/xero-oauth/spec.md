# Delta spec: Xero OAuth credentials (multi-tenant)

## ADDED Requirements

### OAuth callback persistence

- **WHEN** `/api/oauth/callback` completes the authorization code exchange and obtains connections from Xero  
- **THEN** the system MUST persist **every** connection returned by **`GET /connections`** that the product supports (at minimum each **`tenantId`** + **`tenantName`**)  
- **AND** MUST associate those organisations with **one** OAuth credential record created or updated from that token response (same access/refresh pair for that grant).

### Token refresh

- **WHEN** an access token for a tenant is near expiry  
- **THEN** refresh MUST update the **shared credential row** referenced by that tenant’s organisation record  
- **AND** concurrent refreshes MUST use **optimistic concurrency** on that credential row (compare-and-swap on **`token_version`** or equivalent).

### Data model

- **WHEN** the migration is complete  
- **THEN** encrypted OAuth tokens MUST NOT reside in a per-organisation **`xero_oauth_tokens`** table; they MUST reside on a **credential** entity referenced by **organisation** rows.

## REMOVED Requirements

(None until implementation archives prior spec language — sync from main specs at archive time.)

## MODIFIED Requirements

- Single-connection-only persistence (**`connections[0]`** only) is **replaced** by multi-connection persistence as above.
