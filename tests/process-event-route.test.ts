import { beforeEach, describe, expect, it, vi } from "vitest";

const hoisted = vi.hoisted(() => ({
  getEnvMock: vi.fn(),
  getWebhookEventForProcessingMock: vi.fn(),
  getLatestAccountSnapshotByTenantMock: vi.fn(),
  getTenantAccessTokenMock: vi.fn(),
  fetchContactBankLineSnapshotMock: vi.fn(),
  saveAccountSnapshotMock: vi.fn(),
  createAlertFromProcessEventDiffMock: vi.fn(),
  runNotifyJobMock: vi.fn()
}));

vi.mock("@/lib/env", () => ({
  getEnv: hoisted.getEnvMock
}));

vi.mock("@/lib/db/process-event", () => ({
  getWebhookEventForProcessing: hoisted.getWebhookEventForProcessingMock,
  getLatestAccountSnapshotByTenant: hoisted.getLatestAccountSnapshotByTenantMock
}));

vi.mock("@/lib/xero/refresh", () => ({
  getTenantAccessToken: hoisted.getTenantAccessTokenMock
}));

vi.mock("@/lib/xero/accounts", () => ({
  fetchContactBankLineSnapshot: hoisted.fetchContactBankLineSnapshotMock
}));

vi.mock("@/lib/db/account-snapshots", () => ({
  saveAccountSnapshot: hoisted.saveAccountSnapshotMock
}));

vi.mock("@/lib/db/alerts", () => ({
  createAlertFromProcessEventDiff: hoisted.createAlertFromProcessEventDiffMock
}));

vi.mock("@/lib/jobs/notify", () => ({
  runNotifyJob: hoisted.runNotifyJobMock
}));

vi.mock("@/lib/server/pipeline-debug", () => ({
  pipelineDebug: vi.fn().mockResolvedValue(undefined),
  invalidatePipelineDebugCache: vi.fn()
}));

import { POST } from "@/app/api/jobs/process-event/route";

describe("POST /api/jobs/process-event", () => {
  const internalSecret = "internal-secret";

  function buildRequest(body: unknown, secret?: string) {
    const headers: Record<string, string> = {
      "content-type": "application/json"
    };
    if (secret) {
      headers["x-internal-api-secret"] = secret;
    }

    return new Request("http://localhost/api/jobs/process-event", {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.getEnvMock.mockReturnValue({
      XERO_CLIENT_ID: "cid",
      XERO_CLIENT_SECRET: "secret",
      TOKEN_ENCRYPTION_KEY: "enc-key",
      INTERNAL_ADMIN_SECRET: internalSecret
    });
  });

  it("returns 401 when internal auth header is missing", async () => {
    const response = await POST(buildRequest({ webhookEventId: "evt-1" }));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: "Unauthorized internal request" });
  });

  it("returns 403 when internal auth header is invalid", async () => {
    const response = await POST(buildRequest({ webhookEventId: "evt-1" }, "wrong-secret"));
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ message: "Forbidden internal request" });
  });

  it("rejects non-JSON content type", async () => {
    const response = await POST(
      new Request("http://localhost/api/jobs/process-event", {
        method: "POST",
        headers: {
          "x-internal-api-secret": internalSecret,
          "content-type": "text/plain"
        },
        body: "not-json"
      })
    );

    expect(response.status).toBe(415);
    expect(await response.json()).toEqual({ message: "Content-Type must be application/json" });
  });

  it("rejects unexpected fields in request body", async () => {
    const response = await POST(buildRequest({ webhookEventId: "evt-123", unexpected: "value" }, internalSecret));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "Invalid JSON body" });
    expect(hoisted.getWebhookEventForProcessingMock).not.toHaveBeenCalled();
  });

  it("returns 403 when tenant is outside allowed guard", async () => {
    hoisted.getEnvMock.mockReturnValue({
      XERO_CLIENT_ID: "cid",
      XERO_CLIENT_SECRET: "secret",
      TOKEN_ENCRYPTION_KEY: "enc-key",
      XERO_ALLOWED_TENANT_ID: "tenant-allowed",
      INTERNAL_ADMIN_SECRET: internalSecret
    });
    hoisted.getWebhookEventForProcessingMock.mockResolvedValue({
      id: "evt-1",
      idempotencyKey: "idem-1",
      payload: {
        events: [{ tenantId: "tenant-other" }]
      }
    });

    const response = await POST(
      new Request("http://localhost/api/jobs/process-event", {
        method: "POST",
        headers: {
          "x-internal-api-secret": internalSecret,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          webhookEventId: "evt-1"
        })
      })
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ message: "tenantId is not permitted" });
    expect(hoisted.getTenantAccessTokenMock).not.toHaveBeenCalled();
  });

  it("processes event and returns snapshot+diff summary", async () => {
    hoisted.getWebhookEventForProcessingMock.mockResolvedValue({
      id: "evt-1",
      idempotencyKey: "idem-1",
      payload: {
        events: [{ tenantId: "tenant-1" }]
      }
    });
    hoisted.getLatestAccountSnapshotByTenantMock.mockResolvedValue({
      contactBankLines: []
    });
    hoisted.getTenantAccessTokenMock.mockResolvedValue({
      accessToken: "token-1",
      source: "refreshed"
    });
    hoisted.fetchContactBankLineSnapshotMock.mockResolvedValue([
      {
        lineKey: "acc-1",
        contactId: "c-1",
        contactName: "Acme",
        bankAccountName: "Main",
        bsb: null,
        accountNumber: null,
        normalizedBankRef: null
      }
    ]);
    hoisted.saveAccountSnapshotMock.mockResolvedValue({
      organizationId: "org-1",
      lineCount: 1,
      fetchedAt: "2026-05-02T00:10:00.000Z"
    });
    hoisted.createAlertFromProcessEventDiffMock.mockResolvedValue({
      created: true,
      alertId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
    });
    hoisted.runNotifyJobMock.mockResolvedValue({
      message: "Notify job completed",
      status: "sent",
      tenantId: "tenant-1",
      idempotencyKey: "idem-1",
      dedupeKey: "dedupe-1",
      channels: {
        teams: { status: "sent" },
        email: { status: "skipped", reason: "missing-email-env" }
      }
    });

    const response = await POST(
      new Request("http://localhost/api/jobs/process-event", {
        method: "POST",
        headers: {
          "x-internal-api-secret": internalSecret,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          webhookEventId: "evt-1"
        })
      })
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe("Webhook event processed");
    expect(json.tenantId).toBe("tenant-1");
    expect(json.idempotencyKey).toBe("idem-1");
    expect(json.tokenSource).toBe("refreshed");
    expect(json.snapshot).toEqual({
      organizationId: "org-1",
      lineCount: 1,
      fetchedAt: "2026-05-02T00:10:00.000Z"
    });
    expect(json.diff).toEqual({
      added: ["acc-1"],
      removed: [],
      changed: [],
      summary: {
        previousCount: 0,
        currentCount: 1,
        addedCount: 1,
        removedCount: 0,
        changedCount: 0
      }
    });
    expect(json.notify.status).toBe("sent");
    expect(json.alert).toEqual({
      created: true,
      alertId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
    });
    expect(hoisted.createAlertFromProcessEventDiffMock).toHaveBeenCalledTimes(1);
    expect(hoisted.saveAccountSnapshotMock).toHaveBeenCalledWith({
      tenantId: "tenant-1",
      source: "webhook_process_event",
      contactBankLines: expect.any(Array)
    });
    expect(hoisted.runNotifyJobMock).toHaveBeenCalledTimes(1);
  });
});
