import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const hoisted = vi.hoisted(() => ({
  getEnvMock: vi.fn(),
  verifySignatureMock: vi.fn(),
  recordWebhookEventMock: vi.fn(),
  getWebhookEventForProcessingMock: vi.fn(),
  getLatestAccountSnapshotByTenantMock: vi.fn(),
  getTenantAccessTokenMock: vi.fn(),
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

vi.mock("@/lib/db/process-event", () => ({
  getWebhookEventForProcessing: hoisted.getWebhookEventForProcessingMock,
  getLatestAccountSnapshotByTenant: hoisted.getLatestAccountSnapshotByTenantMock
}));

vi.mock("@/lib/xero/refresh", () => ({
  getTenantAccessToken: hoisted.getTenantAccessTokenMock
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

vi.mock("@/lib/server/pipeline-debug", () => ({
  pipelineDebug: vi.fn().mockResolvedValue(undefined),
  invalidatePipelineDebugCache: vi.fn()
}));

import { POST as processEventPost } from "@/app/api/jobs/process-event/route";
import { POST as webhookPost } from "@/app/api/webhooks/xero/route";

function getRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.href;
  }
  return input.url;
}

function parseUrlSafe(urlString: string): URL | null {
  try {
    return new URL(urlString);
  } catch {
    return null;
  }
}

/** Host must match exactly; avoid substring checks (CodeQL js/incomplete-url-substring-sanitization). */
function isXeroContactsListUrl(urlString: string): boolean {
  const u = parseUrlSafe(urlString);
  return u?.hostname === "api.xero.com" && u.pathname.includes("/Contacts");
}

/** Restrict QStash mock to expected host + publish API path. */
function isQstashPublishUrl(urlString: string): boolean {
  const u = parseUrlSafe(urlString);
  if (!u) {
    return false;
  }
  return u.hostname === "qstash.upstash.io" && u.pathname.includes("/v2/publish/");
}

describe("workflow: webhook -> QStash publish -> process-event (real Xero fetch)", () => {
  const internalSecret = "internal-workflow-secret";

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.VERCEL_URL;
    delete process.env.NEXTAUTH_URL;
    hoisted.getEnvMock.mockReturnValue({
      XERO_WEBHOOK_KEY: "webhook-secret",
      QSTASH_TOKEN: "qstash-token",
      INTERNAL_ADMIN_SECRET: internalSecret,
      XERO_CLIENT_ID: "cid",
      XERO_CLIENT_SECRET: "secret",
      TOKEN_ENCRYPTION_KEY: "enc-key"
    });
    hoisted.verifySignatureMock.mockReturnValue(true);
    hoisted.recordWebhookEventMock.mockResolvedValue({
      inserted: true,
      webhookEventId: "evt-wf-1",
      idempotencyKey: "idem-wf-1"
    });
    hoisted.getWebhookEventForProcessingMock.mockResolvedValue({
      id: "evt-wf-1",
      idempotencyKey: "idem-wf-1",
      payload: {
        events: [{ tenantId: "tenant-wf-1" }]
      }
    });
    hoisted.getLatestAccountSnapshotByTenantMock.mockResolvedValue({
      contactBankLines: []
    });
    hoisted.getTenantAccessTokenMock.mockResolvedValue({
      accessToken: "xero-access-token",
      source: "cached"
    });
    hoisted.saveAccountSnapshotMock.mockResolvedValue({
      organizationId: "org-wf-1",
      lineCount: 1,
      fetchedAt: "2026-05-02T12:00:00.000Z"
    });
    hoisted.runNotifyJobMock.mockResolvedValue({
      message: "Notify job completed",
      status: "sent",
      tenantId: "tenant-wf-1",
      idempotencyKey: "idem-wf-1",
      channels: {
        teams: { status: "skipped", reason: "test-mock" },
        email: { status: "skipped", reason: "test-mock" }
      }
    });
    hoisted.createAlertFromProcessEventDiffMock.mockResolvedValue({
      created: true,
      alertId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = getRequestUrl(input);

        if (isXeroContactsListUrl(url)) {
          const headers = new Headers(init?.headers ?? undefined);
          expect(headers.get("Authorization")).toBe("Bearer xero-access-token");
          expect(headers.get("Accept")).toBe("application/json");
          expect(headers.get("Xero-tenant-id")).toBe("tenant-wf-1");
          return new Response(
            JSON.stringify({
              Contacts: [
                {
                  ContactID: "contact-wf-1",
                  Name: "Supplier",
                  BankAccounts: [
                    {
                      BankAccountID: "acc-from-fetch-1",
                      AccountName: "Main",
                      BSB: "123456",
                      AccountNumber: "999888"
                    }
                  ]
                }
              ],
              Pagination: { Page: 1, PageSize: 100, PageCount: 1 }
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }

        if (isQstashPublishUrl(url)) {
          const headers = new Headers(init?.headers ?? undefined);
          expect(headers.get("Authorization")).toBe("Bearer qstash-token");
          expect(headers.get("Upstash-Forward-x-internal-api-secret")).toBe(internalSecret);
          expect(init?.method).toBe("POST");
          const body = typeof init?.body === "string" ? JSON.parse(init.body) : {};
          expect(body).toEqual({
            webhookEventId: "evt-wf-1",
            idempotencyKey: "idem-wf-1"
          });
          return new Response(JSON.stringify({ messageId: "qstash-msg-1" }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        }

        return new Response(`unexpected fetch URL: ${url}`, { status: 500 });
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses mocked HTTP for QStash and Xero Contacts (bank lines) through to snapshot save", async () => {
    const webhookResponse = await webhookPost(
      new Request("http://localhost/api/webhooks/xero", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-xero-signature": "sig"
        },
        body: JSON.stringify({ events: [{ eventId: "ext-1", tenantId: "tenant-wf-1" }] })
      })
    );

    expect(webhookResponse.status).toBe(202);
    const webhookJson = await webhookResponse.json();
    expect(webhookJson).toEqual({
      message: "Webhook accepted and queued",
      idempotencyKey: "idem-wf-1",
      queue: { provider: "qstash", messageId: "qstash-msg-1" }
    });

    const fetchMock = vi.mocked(globalThis.fetch);
    expect(fetchMock).toHaveBeenCalled();
    const qstashCalls = fetchMock.mock.calls.filter((c) =>
      isQstashPublishUrl(getRequestUrl(c[0] as RequestInfo))
    );
    expect(qstashCalls.length).toBeGreaterThan(0);

    const processResponse = await processEventPost(
      new Request("http://localhost/api/jobs/process-event", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-api-secret": internalSecret
        },
        body: JSON.stringify({
          webhookEventId: "evt-wf-1",
          idempotencyKey: "idem-wf-1"
        })
      })
    );

    expect(processResponse.status).toBe(200);
    const processJson = await processResponse.json();
    expect(processJson.message).toBe("Webhook event processed");
    expect(processJson.tenantId).toBe("tenant-wf-1");
    expect(processJson.diff.added).toEqual(["contact-wf-1:acc-from-fetch-1"]);
    expect(processJson.alert).toEqual({
      created: true,
      alertId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
    });

    const xeroCalls = fetchMock.mock.calls.filter((c) =>
      isXeroContactsListUrl(getRequestUrl(c[0] as RequestInfo))
    );
    expect(xeroCalls.length).toBeGreaterThan(0);

    expect(hoisted.saveAccountSnapshotMock).toHaveBeenCalledWith({
      tenantId: "tenant-wf-1",
      source: "webhook_process_event",
      contactBankLines: [
        expect.objectContaining({
          lineKey: "contact-wf-1:acc-from-fetch-1",
          contactName: "Supplier",
          bankAccountName: "Main"
        })
      ]
    });
  });
});
