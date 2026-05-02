import { describe, expect, it } from "vitest";

import {
  validateAdminInternalRouteAuth,
  validateCronInternalRouteAuth,
  validateInternalRouteAuth
} from "@/lib/auth/internal-route-auth";
import { parseEnv } from "@/lib/env";

describe("validateInternalRouteAuth", () => {
  it("returns 500 when primary secret is missing", () => {
    const result = validateInternalRouteAuth(new Request("http://localhost/"), {
      current: undefined,
      envKey: "TEST_SECRET"
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(500);
  });

  it("returns 401 when header is missing", () => {
    const result = validateInternalRouteAuth(new Request("http://localhost/"), {
      current: "primary",
      envKey: "TEST_SECRET"
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(401);
  });

  it("returns 403 when header does not match current or previous", () => {
    const result = validateInternalRouteAuth(
      new Request("http://localhost/", {
        headers: { "x-internal-api-secret": "wrong" }
      }),
      {
        current: "primary",
        previous: "old",
        envKey: "TEST_SECRET"
      }
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
  });

  it("accepts current secret", () => {
    const result = validateInternalRouteAuth(
      new Request("http://localhost/", {
        headers: { "x-internal-api-secret": "primary" }
      }),
      {
        current: "primary",
        previous: "old",
        envKey: "TEST_SECRET"
      }
    );
    expect(result.ok).toBe(true);
  });

  it("accepts previous secret when set", () => {
    const result = validateInternalRouteAuth(
      new Request("http://localhost/", {
        headers: { "x-internal-api-secret": "old" }
      }),
      {
        current: "primary",
        previous: "old",
        envKey: "TEST_SECRET"
      }
    );
    expect(result.ok).toBe(true);
  });
});

describe("validateCronInternalRouteAuth / validateAdminInternalRouteAuth", () => {
  it("cron validator uses INTERNAL_CRON_SECRET", () => {
    const env = parseEnv({
      NODE_ENV: "test",
      INTERNAL_CRON_SECRET: "cron-a",
      INTERNAL_ADMIN_SECRET: "admin-b"
    });
    const ok = validateCronInternalRouteAuth(
      new Request("http://localhost/", {
        headers: { "x-internal-api-secret": "cron-a" }
      }),
      env
    );
    expect(ok.ok).toBe(true);
  });

  it("admin validator uses INTERNAL_ADMIN_SECRET", () => {
    const env = parseEnv({
      NODE_ENV: "test",
      INTERNAL_CRON_SECRET: "cron-a",
      INTERNAL_ADMIN_SECRET: "admin-b"
    });
    const ok = validateAdminInternalRouteAuth(
      new Request("http://localhost/", {
        headers: { "x-internal-api-secret": "admin-b" }
      }),
      env
    );
    expect(ok.ok).toBe(true);
  });
});
