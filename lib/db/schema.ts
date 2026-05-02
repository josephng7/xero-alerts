import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    xeroTenantId: text("xero_tenant_id").notNull(),
    name: text("name"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (t) => [uniqueIndex("organizations_xero_tenant_id_uidx").on(t.xeroTenantId)]
);

export const xeroOauthTokens = pgTable(
  "xero_oauth_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    encryptedAccessToken: text("encrypted_access_token").notNull(),
    encryptedRefreshToken: text("encrypted_refresh_token").notNull(),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }).notNull(),
    tokenVersion: integer("token_version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (t) => [uniqueIndex("xero_oauth_tokens_org_uidx").on(t.organizationId)]
);

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    idempotencyKey: text("idempotency_key").notNull(),
    eventCategory: text("event_category"),
    payload: jsonb("payload").notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow().notNull()
  },
  (t) => [uniqueIndex("webhook_events_idempotency_uidx").on(t.idempotencyKey)]
);

export const accountSnapshots = pgTable(
  "account_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    source: text("source").notNull().default("xero"),
    payload: jsonb("payload").notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (t) => [uniqueIndex("account_snapshots_org_uidx").on(t.organizationId)]
);

export const notifyDispatches = pgTable(
  "notify_dispatches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id").notNull(),
    sourceIdempotencyKey: text("source_idempotency_key"),
    dedupeKey: text("dedupe_key").notNull(),
    payloadDigest: jsonb("payload_digest").notNull(),
    notifiedAt: timestamp("notified_at", { withTimezone: true }).defaultNow().notNull()
  },
  (t) => [uniqueIndex("notify_dispatches_dedupe_uidx").on(t.dedupeKey)]
);

export const alerts = pgTable(
  "alerts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    xeroTenantId: text("xero_tenant_id").notNull(),
    source: text("source").notNull().default("process_event_diff"),
    webhookEventId: uuid("webhook_event_id").references(() => webhookEvents.id, { onDelete: "set null" }),
    idempotencyKey: text("idempotency_key"),
    title: text("title").notNull(),
    diff: jsonb("diff").notNull(),
    acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (t) => [uniqueIndex("alerts_webhook_event_uidx").on(t.webhookEventId)]
);
