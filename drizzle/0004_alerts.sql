CREATE TABLE "alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"xero_tenant_id" text NOT NULL,
	"source" text DEFAULT 'process_event_diff' NOT NULL,
	"webhook_event_id" uuid,
	"idempotency_key" text,
	"title" text NOT NULL,
	"diff" jsonb NOT NULL,
	"acknowledged_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_webhook_event_id_webhook_events_id_fk" FOREIGN KEY ("webhook_event_id") REFERENCES "public"."webhook_events"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "alerts_webhook_event_uidx" ON "alerts" USING btree ("webhook_event_id");
--> statement-breakpoint
CREATE INDEX "alerts_tenant_created_idx" ON "alerts" USING btree ("xero_tenant_id", "created_at" DESC);
--> statement-breakpoint
ALTER TABLE "alerts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "alerts_service_role_all" ON "alerts";
--> statement-breakpoint
CREATE POLICY "alerts_service_role_all"
  ON "alerts"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
