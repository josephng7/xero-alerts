CREATE TABLE "app_runtime_settings" (
	"id" integer PRIMARY KEY NOT NULL,
	"pipeline_debug" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "app_runtime_settings" ("id", "pipeline_debug") VALUES (1, false);
--> statement-breakpoint
ALTER TABLE "app_runtime_settings" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "app_runtime_settings_service_role_all" ON "app_runtime_settings";
--> statement-breakpoint
CREATE POLICY "app_runtime_settings_service_role_all"
  ON "app_runtime_settings"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
