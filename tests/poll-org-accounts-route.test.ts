import { afterEach, describe, expect, it, vi } from "vitest";

import type { SnapshotStaleness } from "@/lib/db/account-snapshots";

const {
  getEnvMock,
  getSnapshotStalenessMock,
  saveAccountSnapshotMock,
  getTenantAccessTokenMock,
  fetchBankAccountSnapshotMock
} = vi.hoisted(() => ({
  getEnvMock: vi.fn(),
  getSnapshotStalenessMock: vi.fn(),
  saveAccountSnapshotMock: vi.fn(),
  getTenantAccessTokenMock: vi.fn(),
  fetchBankAccountSnapshotMock: vi.fn()
}));

vi.mock("@/lib/env", () => ({
  getEnv: getEnvMock
}));

vi.mock("@/lib/db/account-snapshots", () => ({
  getSnapshotStaleness: getSnapshotStalenessMock,
  saveAccountSnapshot: saveAccountSnapshotMock
}));

vi.mock("@/lib/xero/refresh", () => ({
  getTenantAccessToken: getTenantAccessTokenMock
}));

vi.mock("@/lib/xero/accounts", () => ({
  fetchBankAccountSnapshot: fetchBankAccountSnapshotMock
}));

import { POST } from "@/app/api/cron/poll-org-accounts/route";

function buildRequest(body: unknown, secret?: string) {
  const headers: Record<string, string> = {
    "content-type": "application/json"
  };
  if (secret) {
    headers["x-internal-api-secret"] = secret;
  }

  return new Request("http://localhost/api/cron/poll-org-accounts", {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
}

describe("POST /api/cron/poll-org-accounts", () => {
  const internalSecret = "internal-secret";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when internal auth header is missing", async () => {
    getEnvMock.mockReturnValue({
      NODE_ENV: "test",
      XERO_CLIENT_ID: "cid",
      XERO_CLIENT_SECRET: "secret",
      TOKEN_ENCRYPTION_KEY: "key",
      INTERNAL_API_SECRET: internalSecret
    });

    const response = await POST(buildRequest({ tenantId: "tenant-allowed" }));
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.message).toBe("Unauthorized internal request");
  });

  it("returns 403 when internal auth header is invalid", async () => {
    getEnvMock.mockReturnValue({
      NODE_ENV: "test",
      XERO_CLIENT_ID: "cid",
      XERO_CLIENT_SECRET: "secret",
      TOKEN_ENCRYPTION_KEY: "key",
      INTERNAL_API_SECRET: internalSecret
    });

    const response = await POST(buildRequest({ tenantId: "tenant-allowed" }, "bad-secret"));
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.message).toBe("Forbidden internal request");
  });

  it("returns 403 when tenant is not allowed", async () => {
    getEnvMock.mockReturnValue({
      NODE_ENV: "test",
      XERO_CLIENT_ID: "cid",
      XERO_CLIENT_SECRET: "secret",
      TOKEN_ENCRYPTION_KEY: "key",
      INTERNAL_API_SECRET: internalSecret,
      XERO_ALLOWED_TENANT_ID: "tenant-allowed"
    });

    const response = await POST(buildRequest({ tenantId: "tenant-other" }, internalSecret));
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.message).toBe("tenantId is not permitted");
    expect(getTenantAccessTokenMock).not.toHaveBeenCalled();
  });

  it("polls tenant, persists snapshot, and returns staleness summary", async () => {
    const stalenessBefore: SnapshotStaleness = {
      state: "stale",
      staleAfterSeconds: 900,
      ageSeconds: 1900,
      previousFetchedAt: "2026-05-01T10:00:00.000Z"
    };

    getEnvMock.mockReturnValue({
      NODE_ENV: "test",
      XERO_CLIENT_ID: "cid",
      XERO_CLIENT_SECRET: "secret",
      TOKEN_ENCRYPTION_KEY: "key",
      INTERNAL_API_SECRET: internalSecret,
      XERO_ALLOWED_TENANT_ID: "tenant-1"
    });
    getSnapshotStalenessMock.mockResolvedValue(stalenessBefore);
    getTenantAccessTokenMock.mockResolvedValue({
      tenantId: "tenant-1",
      tenantName: "Org",
      accessToken: "access-token",
      expiresAt: new Date("2026-05-02T00:00:00.000Z"),
      source: "refreshed",
      tokenVersion: 3
    });
    fetchBankAccountSnapshotMock.mockResolvedValue([
      {
        accountId: "acc-1",
        code: "090",
        name: "Operating",
        type: "BANK",
        status: "ACTIVE",
        bankAccountNumber: null,
        currencyCode: "USD",
        updatedDateUtc: null
      }
    ]);
    saveAccountSnapshotMock.mockResolvedValue({
      organizationId: "org-1",
      accountCount: 1,
      fetchedAt: "2026-05-02T00:10:00.000Z"
    });

    const response = await POST(buildRequest({ tenantId: "tenant-1" }, internalSecret));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.accountCount).toBe(1);
    expect(json.fetchedAt).toBe("2026-05-02T00:10:00.000Z");
    expect(json.sourceUsed).toEqual({
      snapshot: "xero_poll",
      token: "refreshed"
    });
    expect(json.staleness.beforePoll).toEqual(stalenessBefore);
    expect(json.staleness.afterPoll).toEqual({
      state: "fresh",
      staleAfterSeconds: 900,
      ageSeconds: 0,
      previousFetchedAt: "2026-05-02T00:10:00.000Z"
    });
    expect(getSnapshotStalenessMock).toHaveBeenCalledWith({ tenantId: "tenant-1" });
    expect(saveAccountSnapshotMock).toHaveBeenCalledWith({
      tenantId: "tenant-1",
      source: "xero_poll",
      accounts: expect.any(Array)
    });
  });
});
