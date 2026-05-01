ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "webhook_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "xero_oauth_tokens" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "organizations_service_role_all" ON "organizations";
CREATE POLICY "organizations_service_role_all"
  ON "organizations"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "webhook_events_service_role_all" ON "webhook_events";
CREATE POLICY "webhook_events_service_role_all"
  ON "webhook_events"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "xero_oauth_tokens_service_role_all" ON "xero_oauth_tokens";
CREATE POLICY "xero_oauth_tokens_service_role_all"
  ON "xero_oauth_tokens"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
