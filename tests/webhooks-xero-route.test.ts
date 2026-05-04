import { beforeEach, describe, expect, it, vi } from "vitest";

const hoisted = vi.hoisted(() => ({
  getEnvMock: vi.fn(),
  verifySignatureMock: vi.fn(),
  recordWebhookEventMock: vi.fn(),
  enqueueProcessEventJobMock: vi.fn()
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

vi.mock("@/lib/server/pipeline-debug", () => ({
  pipelineDebug: vi.fn().mockResolvedValue(undefined),
  invalidatePipelineDebugCache: vi.fn()
}));

vi.mock("@/lib/queue/qstash", () => ({
  DEFAULT_QSTASH_URL: "https://qstash.upstash.io",
  enqueueProcessEventJob: hoisted.enqueueProcessEventJobMock
}));

import { POST } from "@/app/api/webhooks/xero/route";

describe("POST /api/webhooks/xero", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.VERCEL_URL;
    delete process.env.NEXTAUTH_URL;
    hoisted.getEnvMock.mockReturnValue({
      XERO_WEBHOOK_KEY: "webhook-secret"
    });
    hoisted.verifySignatureMock.mockReturnValue(true);
    hoisted.recordWebhookEventMock.mockResolvedValue({
      inserted: true,
      webhookEventId: "evt-1",
      idempotencyKey: "idem-1"
    });
  });

  it("rejects non-JSON content type", async () => {
    const response = await POST(
      new Request("http://localhost/api/webhooks/xero", {
        method: "POST",
        headers: {
          "content-type": "text/plain",
          "x-xero-signature": "sig"
        },
        body: "payload"
      })
    );

    expect(response.status).toBe(415);
    expect(await response.json()).toEqual({ message: "Content-Type must be application/json" });
    expect(hoisted.verifySignatureMock).not.toHaveBeenCalled();
  });

  it("rejects oversized payload via content-length", async () => {
    const response = await POST(
      new Request("http://localhost/api/webhooks/xero", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "content-length": String(300 * 1024),
          "x-xero-signature": "sig"
        },
        body: JSON.stringify({ events: [] })
      })
    );

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ message: "Payload too large" });
    expect(hoisted.verifySignatureMock).not.toHaveBeenCalled();
  });

  it("returns 202 with queue metadata when queue handoff succeeds", async () => {
    hoisted.getEnvMock.mockReturnValue({
      XERO_WEBHOOK_KEY: "webhook-secret",
      QSTASH_TOKEN: "qstash-token",
      INTERNAL_ADMIN_SECRET: "admin-secret"
    });
    hoisted.enqueueProcessEventJobMock.mockResolvedValue({ messageId: "msg-1" });

    const response = await POST(
      new Request("http://localhost/api/webhooks/xero", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-xero-signature": "sig"
        },
        body: JSON.stringify({ events: [{ eventId: "evt-1", tenantId: "tenant-1" }] })
      })
    );
    const json = await response.json();

    expect(response.status).toBe(202);
    expect(json).toEqual({
      message: "Webhook accepted and queued",
      idempotencyKey: "idem-1",
      queue: { provider: "qstash", messageId: "msg-1" }
    });
    expect(hoisted.recordWebhookEventMock).toHaveBeenCalled();
    expect(hoisted.enqueueProcessEventJobMock).toHaveBeenCalledWith({
      qstashUrl: "https://qstash.upstash.io",
      qstashToken: "qstash-token",
      callbackBaseUrl: "http://localhost:3000",
      internalApiSecret: "admin-secret",
      payload: {
        webhookEventId: "evt-1",
        idempotencyKey: "idem-1"
      }
    });
  });

  it("uses NEXTAUTH_URL and QSTASH_URL when set", async () => {
    process.env.VERCEL_URL = "my-app.vercel.app";
    process.env.NEXTAUTH_URL = "https://app.example.com";
    hoisted.getEnvMock.mockReturnValue({
      XERO_WEBHOOK_KEY: "webhook-secret",
      QSTASH_URL: "https://custom.qstash.example",
      QSTASH_TOKEN: "qstash-token",
      INTERNAL_ADMIN_SECRET: "admin-secret"
    });
    hoisted.enqueueProcessEventJobMock.mockResolvedValue({ messageId: "msg-2" });

    const response = await POST(
      new Request("http://localhost/api/webhooks/xero", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-xero-signature": "sig"
        },
        body: JSON.stringify({ events: [{ eventId: "evt-1", tenantId: "tenant-1" }] })
      })
    );

    expect(response.status).toBe(202);
    expect(hoisted.enqueueProcessEventJobMock).toHaveBeenCalledWith({
      qstashUrl: "https://custom.qstash.example",
      qstashToken: "qstash-token",
      callbackBaseUrl: "https://app.example.com",
      internalApiSecret: "admin-secret",
      payload: {
        webhookEventId: "evt-1",
        idempotencyKey: "idem-1"
      }
    });
  });

  it("returns 500 when QSTASH_TOKEN is set without INTERNAL_ADMIN_SECRET", async () => {
    hoisted.getEnvMock.mockReturnValue({
      XERO_WEBHOOK_KEY: "webhook-secret",
      QSTASH_TOKEN: "qstash-token"
    });

    const response = await POST(
      new Request("http://localhost/api/webhooks/xero", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-xero-signature": "sig"
        },
        body: JSON.stringify({ events: [{ eventId: "evt-1", tenantId: "tenant-1" }] })
      })
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      message:
        "Queue handoff requires INTERNAL_ADMIN_SECRET so QStash can forward x-internal-api-secret to the worker"
    });
    expect(hoisted.enqueueProcessEventJobMock).not.toHaveBeenCalled();
  });

  it("returns 200 for duplicate webhook event", async () => {
    hoisted.recordWebhookEventMock.mockResolvedValue({
      inserted: false,
      webhookEventId: "evt-1",
      idempotencyKey: "idem-dup"
    });

    const response = await POST(
      new Request("http://localhost/api/webhooks/xero", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-xero-signature": "sig"
        },
        body: JSON.stringify({ events: [{ eventId: "evt-1", tenantId: "tenant-1" }] })
      })
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      message: "Duplicate webhook ignored",
      idempotencyKey: "idem-dup"
    });
    expect(hoisted.enqueueProcessEventJobMock).not.toHaveBeenCalled();
  });
});
