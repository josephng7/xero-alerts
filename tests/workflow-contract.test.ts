import { describe, expect, it, vi } from "vitest";

const hoisted = vi.hoisted(() => ({
  getEnvMock: vi.fn(),
  verifySignatureMock: vi.fn(),
  recordWebhookEventMock: vi.fn(),
  enqueueProcessEventJobMock: vi.fn(),
  getWebhookEventForProcessingMock: vi.fn(),
  getLatestAccountSnapshotByTenantMock: vi.fn(),
  getTenantAccessTokenMock: vi.fn(),
  fetchBankAccountSnapshotMock: vi.fn(),
  saveAccountSnapshotMock: vi.fn(),
  runNotifyJobMock: vi.fn()
}));

vi.mock("@/lib/env", () => ({
  getEnv: hoisted.getEnvMock
}));

vi.mock("@/lib/signature", () => ({
  verifyXeroWebhookSignature: hoisted.verifySignatureMock
}));

vi.mock("@/lib/db/webhook-events", () => ({
  recordWebhookEvent: hoisted.recordWebhookEventMock
}));

vi.mock("@/lib/queue/qstash", () => ({
  enqueueProcessEventJob: hoisted.enqueueProcessEventJobMock
}));

vi.mock("@/lib/db/process-event", () => ({
  getWebhookEventForProcessing: hoisted.getWebhookEventForProcessingMock,
  getLatestAccountSnapshotByTenant: hoisted.getLatestAccountSnapshotByTenantMock
}));

vi.mock("@/lib/xero/refresh", () => ({
  getTenantAccessToken: hoisted.getTenantAccessTokenMock
}));

vi.mock("@/lib/xero/accounts", () => ({
  fetchBankAccountSnapshot: hoisted.fetchBankAccountSnapshotMock
}));

vi.mock("@/lib/db/account-snapshots", () => ({
  saveAccountSnapshot: hoisted.saveAccountSnapshotMock
}));

vi.mock("@/lib/jobs/notify", () => ({
  runNotifyJob: hoisted.runNotifyJobMock
}));

import { POST as processEventPost } from "@/app/api/jobs/process-event/route";
import { POST as webhookPost } from "@/app/api/webhooks/xero/route";

describe("workflow contract: webhook -> process-event -> notify", () => {
  it("keeps payload contracts compatible across route boundaries", async () => {
    vi.clearAllMocks();
    hoisted.getEnvMock.mockReturnValue({
      XERO_WEBHOOK_KEY: "webhook-secret",
      QSTASH_URL: "https://qstash.upstash.io",
      QSTASH_TOKEN: "qstash-token",
      NEXTAUTH_URL: "https://app.example.com",
      INTERNAL_API_SECRET: "internal-secret",
      XERO_CLIENT_ID: "cid",
      XERO_CLIENT_SECRET: "secret",
      TOKEN_ENCRYPTION_KEY: "enc-key",
      TEAMS_WEBHOOK_URL: "https://teams.example/webhook"
    });
    hoisted.verifySignatureMock.mockReturnValue(true);
    hoisted.recordWebhookEventMock.mockResolvedValue({
      inserted: true,
      webhookEventId: "evt-1",
      idempotencyKey: "idem-1"
    });
    hoisted.enqueueProcessEventJobMock.mockResolvedValue({ messageId: "msg-1" });
    hoisted.getWebhookEventForProcessingMock.mockResolvedValue({
      id: "evt-1",
      idempotencyKey: "idem-1",
      payload: {
        events: [{ tenantId: "tenant-1" }]
      }
    });
    hoisted.getLatestAccountSnapshotByTenantMock.mockResolvedValue({ accounts: [] });
    hoisted.getTenantAccessTokenMock.mockResolvedValue({
      accessToken: "token-1",
      source: "refreshed"
    });
    hoisted.fetchBankAccountSnapshotMock.mockResolvedValue([
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
    hoisted.saveAccountSnapshotMock.mockResolvedValue({
      organizationId: "org-1",
      accountCount: 1,
      fetchedAt: "2026-05-02T00:10:00.000Z"
    });
    hoisted.runNotifyJobMock.mockResolvedValue({
      status: "sent",
      message: "Notify job completed"
    });

    const webhookResponse = await webhookPost(
      new Request("http://localhost/api/webhooks/xero", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-xero-signature": "sig"
        },
        body: JSON.stringify({ events: [{ eventId: "evt-1", tenantId: "tenant-1" }] })
      })
    );
    expect(webhookResponse.status).toBe(202);
    const queuedPayload = hoisted.enqueueProcessEventJobMock.mock.calls[0]?.[0]?.payload as {
      webhookEventId: string;
      idempotencyKey: string;
    };

    const processResponse = await processEventPost(
      new Request("http://localhost/api/jobs/process-event", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-api-secret": "internal-secret"
        },
        body: JSON.stringify(queuedPayload)
      })
    );
    expect(processResponse.status).toBe(200);
    const processJson = await processResponse.json();
    expect(processJson.notify.status).toBe("sent");
    expect(hoisted.runNotifyJobMock).toHaveBeenCalledWith(
      {
        tenantId: "tenant-1",
        idempotencyKey: "idem-1",
        diff: processJson.diff
      },
      expect.objectContaining({
        INTERNAL_API_SECRET: "internal-secret"
      })
    );
  });
});
