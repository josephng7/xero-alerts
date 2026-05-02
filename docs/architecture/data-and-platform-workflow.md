# Data and platform workflow

High-level view of **platforms**, **persistence**, and **request flows**. Table shapes and migrations are defined in code (`lib/db/schema.ts`, `drizzle/`); this page is an orientation map only.

## Platforms and stores

```mermaid
flowchart TB
  subgraph Xero["Xero"]
    XO[Developer app + OAuth]
    XW[Webhooks]
    XA[Accounts API]
  end

  subgraph Host["Application host e.g. Vercel"]
    APP[Next.js app]
  end

  subgraph DB["Supabase Postgres"]
    PG[(Drizzle-managed tables)]
  end

  subgraph Queue["Upstash QStash optional"]
    QS[Publish / deliver]
  end

  subgraph Notify["Notifications optional"]
    TM[Microsoft Teams]
    RS[Resend email]
  end

  subgraph Cron["Scheduled callers"]
    CR[Cron / scheduler]
  end

  XO -->|OAuth redirect + tokens| APP
  XW -->|POST signed webhook| APP
  APP -->|optional enqueue| QS
  QS -->|POST process-event| APP
  APP -->|read/write| PG
  APP -->|fetch BANK accounts| XA
  APP -->|optional| TM
  APP -->|optional| RS
  CR -->|POST poll-org + cron secret| APP
```

## Persistence overview

| Table | Role in the pipeline |
| ----- | -------------------- |
| `organizations` | Tenant identity keyed by Xero tenant id. |
| `xero_oauth_tokens` | Encrypted OAuth tokens per organization. |
| `webhook_events` | Idempotent intake of Xero webhook payloads. |
| `account_snapshots` | Latest BANK snapshot payload per organization. |
| `alerts` | Operator-visible alerts (e.g. from actionable diffs). |
| `notify_dispatches` | Durable dedupe for outbound notifications. |

RLS is enabled on tables; the app connects with credentials that match your migration policies (see `drizzle/` service-role policies).

## Main runtime flows

### Webhook intake and processing

```mermaid
flowchart LR
  subgraph Ingest["Webhook ingest"]
    W[POST /api/webhooks/xero]
    W --> DED[(webhook_events dedupe)]
    W --> Q{QStash configured?}
    Q -->|yes| ENQ[Enqueue process-event]
  end

  subgraph Worker["Process event"]
    PE[POST /api/jobs/process-event]
    PE --> TOK[Xero token refresh / read]
    PE --> FETCH[Accounts API]
    PE --> SNAP[(account_snapshots)]
    PE --> DIFF[Diff vs prior snapshot]
    PE --> AL[(alerts if actionable)]
    PE --> NF[Notify job]
  end

  subgraph Out["Notify optional"]
    NF --> ND[(notify_dispatches)]
    NF --> TM[Teams]
    NF --> EM[Email]
  end

  ENQ --> PE
```

### OAuth connect (tenant linkage)

```mermaid
flowchart LR
  C[/GET /api/connect/xero/] --> CB[/GET /api/oauth/callback/]
  CB --> ORG[(organizations)]
  CB --> TOK[(xero_oauth_tokens)]
```

### Supporting operator and cron paths

```mermaid
flowchart TB
  POLL[POST /api/cron/poll-org-accounts] --> SNAP2[(account_snapshots)]
  SYNC[POST /api/admin/sync-snapshots] --> SNAP2
  ALRT[GET /api/alerts ...] --> AL2[(alerts)]
  H[GET /api/health] --> PG2[(Postgres probe)]
```

## Related

- Operator procedures: [`docs/runbooks/go-live.md`](../runbooks/go-live.md), [`docs/runbooks/webhook-pipeline.md`](../runbooks/webhook-pipeline.md)
- Trust model: [`trust-and-secrets.md`](./trust-and-secrets.md)
