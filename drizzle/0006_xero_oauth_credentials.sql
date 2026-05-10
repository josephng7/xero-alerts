CREATE TABLE "xero_oauth_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"encrypted_access_token" text NOT NULL,
	"encrypted_refresh_token" text NOT NULL,
	"access_token_expires_at" timestamp with time zone NOT NULL,
	"token_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "credential_id" uuid;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_credential_id_xero_oauth_credentials_id_fk" FOREIGN KEY ("credential_id") REFERENCES "public"."xero_oauth_credentials"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "organizations_credential_id_idx" ON "organizations" USING btree ("credential_id");--> statement-breakpoint
-- Backfill: migrate existing xero_oauth_tokens rows into xero_oauth_credentials.
-- Each legacy token row becomes one credential; the org is then linked to it.
-- Safe to run on empty tables (loop body simply never executes).
DO $$
DECLARE
  r RECORD;
  new_cred_id uuid;
BEGIN
  FOR r IN
    SELECT t.organization_id,
           t.encrypted_access_token,
           t.encrypted_refresh_token,
           t.access_token_expires_at,
           t.token_version,
           t.created_at,
           t.updated_at
    FROM xero_oauth_tokens t
  LOOP
    INSERT INTO xero_oauth_credentials (
      id, encrypted_access_token, encrypted_refresh_token,
      access_token_expires_at, token_version, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      r.encrypted_access_token,
      r.encrypted_refresh_token,
      r.access_token_expires_at,
      r.token_version,
      r.created_at,
      r.updated_at
    )
    RETURNING id INTO new_cred_id;

    UPDATE organizations SET credential_id = new_cred_id WHERE id = r.organization_id;
  END LOOP;
END $$;
--> statement-breakpoint
ALTER TABLE "xero_oauth_tokens" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "xero_oauth_tokens" CASCADE;--> statement-breakpoint
ALTER TABLE "xero_oauth_credentials" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS "xero_oauth_credentials_service_role_all" ON "xero_oauth_credentials";--> statement-breakpoint
CREATE POLICY "xero_oauth_credentials_service_role_all"
  ON "xero_oauth_credentials"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
