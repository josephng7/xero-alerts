import { beforeEach, describe, expect, it, vi } from "vitest";

const hoisted = vi.hoisted(() => ({
  getEnvMock: vi.fn(),
  getTenantAccessTokenMock: vi.fn()
}));

vi.mock("@/lib/env", () => ({
  getEnv: hoisted.getEnvMock
}));

vi.mock("@/lib/xero/refresh", () => ({
  getTenantAccessToken: hoisted.getTenantAccessTokenMock
}));

vi.mock("@/lib/xero/accounts", () => ({
  fetchBankAccountSnapshot: vi.fn()
}));

vi.mock("@/lib/db/account-snapshots", () => ({
  saveAccountSnapshot: vi.fn()
}));

import { POST } from "@/app/api/admin/sync-snapshots/route";

describe("POST /api/admin/sync-snapshots", () => {
  const internalSecret = "internal-secret";

  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.getEnvMock.mockReturnValue({
      XERO_CLIENT_ID: "cid",
      XERO_CLIENT_SECRET: "secret",
      TOKEN_ENCRYPTION_KEY: "key",
      INTERNAL_ADMIN_SECRET: internalSecret,
      XERO_ALLOWED_TENANT_ID: "tenant-allowed"
    });
  });

  it("returns 401 when internal auth header is missing", async () => {
    const response = await POST(
      new Request("http://localhost/api/admin/sync-snapshots", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ tenantId: "tenant-allowed" })
      })
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: "Unauthorized internal request" });
    expect(hoisted.getTenantAccessTokenMock).not.toHaveBeenCalled();
  });

  it("returns 403 when internal auth header is invalid", async () => {
    const response = await POST(
      new Request("http://localhost/api/admin/sync-snapshots", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-api-secret": "bad-secret"
        },
        body: JSON.stringify({ tenantId: "tenant-allowed" })
      })
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ message: "Forbidden internal request" });
    expect(hoisted.getTenantAccessTokenMock).not.toHaveBeenCalled();
  });

  it("returns 403 when cron secret is used on admin route", async () => {
    hoisted.getEnvMock.mockReturnValue({
      XERO_CLIENT_ID: "cid",
      XERO_CLIENT_SECRET: "secret",
      TOKEN_ENCRYPTION_KEY: "key",
      INTERNAL_CRON_SECRET: "cron-only",
      INTERNAL_ADMIN_SECRET: internalSecret,
      XERO_ALLOWED_TENANT_ID: "tenant-allowed"
    });

    const response = await POST(
      new Request("http://localhost/api/admin/sync-snapshots", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-api-secret": "cron-only"
        },
        body: JSON.stringify({ tenantId: "tenant-allowed" })
      })
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ message: "Forbidden internal request" });
    expect(hoisted.getTenantAccessTokenMock).not.toHaveBeenCalled();
  });

  it("returns 403 when tenant is not allow-listed", async () => {
    const response = await POST(
      new Request("http://localhost/api/admin/sync-snapshots", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-api-secret": internalSecret
        },
        body: JSON.stringify({ tenantId: "tenant-other" })
      })
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ message: "tenantId is not permitted" });
    expect(hoisted.getTenantAccessTokenMock).not.toHaveBeenCalled();
  });
});
