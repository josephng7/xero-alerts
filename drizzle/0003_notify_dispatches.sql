CREATE TABLE "notify_dispatches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"source_idempotency_key" text,
	"dedupe_key" text NOT NULL,
	"payload_digest" jsonb NOT NULL,
	"notified_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "notify_dispatches_dedupe_uidx" ON "notify_dispatches" USING btree ("dedupe_key");
--> statement-breakpoint
ALTER TABLE "notify_dispatches" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "notify_dispatches_service_role_all" ON "notify_dispatches";
--> statement-breakpoint
CREATE POLICY "notify_dispatches_service_role_all"
  ON "notify_dispatches"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
