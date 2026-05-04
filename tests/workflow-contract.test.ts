import { describe, expect, it, vi } from "vitest";

const hoisted = vi.hoisted(() => ({
  getEnvMock: vi.fn(),
  verifySignatureMock: vi.fn(),
  recordWebhookEventMock: vi.fn(),
  enqueueProcessEventJobMock: vi.fn(),
  getWebhookEventForProcessingMock: vi.fn(),
  getLatestAccountSnapshotByTenantMock: vi.fn(),
  getTenantAccessTokenMock: vi.fn(),
  fetchContactBankLineSnapshotMock: vi.fn(),
  saveAccountSnapshotMock: vi.fn(),
  runNotifyJobMock: vi.fn(),
  createAlertFromProcessEventDiffMock: vi.fn()
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
  DEFAULT_QSTASH_URL: "https://qstash.upstash.io",
  enqueueProcessEventJob: hoisted.enqueueProcessEventJobMock
}));

vi.mock("@/lib/server/pipeline-debug", () => ({
  pipelineDebug: vi.fn().mockResolvedValue(undefined),
  invalidatePipelineDebugCache: vi.fn()
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

vi.mock("@/lib/jobs/notify", () => ({
  runNotifyJob: hoisted.runNotifyJobMock
}));

vi.mock("@/lib/db/alerts", () => ({
  createAlertFromProcessEventDiff: hoisted.createAlertFromProcessEventDiffMock
}));

import { POST as processEventPost } from "@/app/api/jobs/process-event/route";
import { POST as webhookPost } from "@/app/api/webhooks/xero/route";

describe("workflow contract: webhook -> process-event -> notify", () => {
  it("keeps payload contracts compatible across route boundaries", async () => {
    vi.clearAllMocks();
    delete process.env.VERCEL_URL;
    delete process.env.NEXTAUTH_URL;
    hoisted.getEnvMock.mockReturnValue({
      XERO_WEBHOOK_KEY: "webhook-secret",
      QSTASH_TOKEN: "qstash-token",
      INTERNAL_ADMIN_SECRET: "internal-secret",
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
    hoisted.getLatestAccountSnapshotByTenantMock.mockResolvedValue({ contactBankLines: [] });
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
    hoisted.runNotifyJobMock.mockResolvedValue({
      status: "sent",
      message: "Notify job completed"
    });
    hoisted.createAlertFromProcessEventDiffMock.mockResolvedValue({ created: false, alertId: null });

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
        INTERNAL_ADMIN_SECRET: "internal-secret"
      })
    );
  });
});
