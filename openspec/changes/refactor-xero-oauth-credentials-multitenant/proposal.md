# Proposal: Normalized Xero OAuth credentials (one grant → many tenants)

## Problem

Today **`organizations`** and **`xero_oauth_tokens`** are 1:1. OAuth callback uses **`fetchPrimaryConnection`** and only persists **`GET /connections` `[0]`**, so additional organisations authorised in the same Xero consent are ignored. Duplicating encrypted tokens per org would be wasteful and conflicts with how Xero issues **one refresh chain per consent** usable across tenants via **`Xero-tenant-id`**.

## Change (ultimate shape — Option III)

- Introduce a **`xero_oauth_credentials`** (name TBD) table holding **encrypted access/refresh tokens**, **expiry**, and **`token_version`** for **optimistic refresh** (single CAS target per grant).
- Link **`organizations`** (or a dedicated **tenant connection** table) to **`credential_id`** so **many tenant ids** can share **one** credential row after a single OAuth completion.
- OAuth callback: persist **all relevant connections** from **`GET /connections`** (each tenant gets/upgrades org row + shared **`credential_id`**).
- **`getTenantAccessToken`**: resolve **`tenantId` → organization → credential`**, refresh updates **credential** row only.

## Non-goals (this change id)

- Replacing **`XERO_ALLOWED_TENANT_ID`** policy (can remain as optional single-tenant guard).
- Storing Xero **user** identity for audit (optional follow-up; OpenID claims).

## Security

- Tokens remain **AES-GCM encrypted at rest**; no plaintext in new tables.
- Refresh concurrency uses **one** versioned row per credential (existing pattern, relocated).

## Timing

Implement **after** the scheduled live demo; this OpenSpec packages design + phased tasks for that window.
