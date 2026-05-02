import { describe, expect, it } from "vitest";

import { parseEnv } from "@/lib/env";

describe("parseEnv", () => {
  it("accepts a minimal valid payload", () => {
    const parsed = parseEnv({ NODE_ENV: "development" });

    expect(parsed.NODE_ENV).toBe("development");
  });

  it("rejects malformed URL values", () => {
    expect(() => parseEnv({ NODE_ENV: "development", QSTASH_URL: "not-a-url" })).toThrow(
      "Invalid environment configuration"
    );
  });

  it("treats empty optional vars as unset", () => {
    const parsed = parseEnv({
      NODE_ENV: "development",
      XERO_ALLOWED_TENANT_ID: "",
      INTERNAL_CRON_SECRET: "   ",
      KV_REST_API_URL: "",
      QSTASH_URL: "",
      TEAMS_WEBHOOK_URL: "",
      ALERTS_FROM_EMAIL: "",
      SENTRY_DSN: ""
    });

    expect(parsed.XERO_ALLOWED_TENANT_ID).toBeUndefined();
    expect(parsed.INTERNAL_CRON_SECRET).toBeUndefined();
    expect(parsed.KV_REST_API_URL).toBeUndefined();
    expect(parsed.QSTASH_URL).toBeUndefined();
  });
});
