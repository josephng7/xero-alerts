import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(1).optional(),
  XERO_CLIENT_ID: z.string().min(1).optional(),
  XERO_CLIENT_SECRET: z.string().min(1).optional(),
  XERO_WEBHOOK_KEY: z.string().min(1).optional(),
  XERO_ALLOWED_TENANT_ID: z.string().min(1).optional(),
  TOKEN_ENCRYPTION_KEY: z.string().min(1).optional(),
  INTERNAL_API_SECRET: z.string().min(1).optional(),
  DATABASE_URL: z.string().min(1).optional(),
  KV_REST_API_URL: z.string().url().optional(),
  KV_REST_API_TOKEN: z.string().min(1).optional(),
  QSTASH_URL: z.string().url().optional(),
  QSTASH_TOKEN: z.string().min(1).optional(),
  QSTASH_CURRENT_SIGNING_KEY: z.string().min(1).optional(),
  QSTASH_NEXT_SIGNING_KEY: z.string().min(1).optional(),
  TEAMS_WEBHOOK_URL: z.string().url().optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  ALERTS_FROM_EMAIL: z.string().email().optional(),
  ALERTS_TO_EMAIL: z.string().email().optional(),
  SENTRY_DSN: z.string().url().optional()
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(input: Record<string, string | undefined>): Env {
  const parsed = envSchema.safeParse(input);

  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${message}`);
  }

  return parsed.data;
}

export function getEnv(): Env {
  return parseEnv(process.env);
}
