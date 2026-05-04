import { beforeEach, describe, expect, it, vi } from "vitest";

const hoisted = vi.hoisted(() => ({
  getEnvMock: vi.fn(),
  publishQstashJobMock: vi.fn()
}));

vi.mock("@/lib/env", () => ({
  getEnv: hoisted.getEnvMock
}));

vi.mock("@/lib/queue/qstash", () => ({
  DEFAULT_QSTASH_URL: "https://qstash.upstash.io",
  publishQstashJob: hoisted.publishQstashJobMock,
  enqueueProcessEventJob: vi.fn()
}));

import { POST } from "@/app/api/admin/test-qstash-enqueue/route";

describe("POST /api/admin/test-qstash-enqueue", () => {
  const internalSecret = "internal-secret";

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXTAUTH_URL = "https://app.example.test";
    hoisted.getEnvMock.mockReturnValue({
      INTERNAL_ADMIN_SECRET: internalSecret,
      QSTASH_TOKEN: "qstash-token"
    });
    hoisted.publishQstashJobMock.mockResolvedValue({ messageId: "msg-1" });
  });

  it("returns 401 when internal auth header is missing", async () => {
    const response = await POST(
      new Request("http://localhost/api/admin/test-qstash-enqueue", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}"
      })
    );
    expect(response.status).toBe(401);
  });

  it("returns 400 when QSTASH_TOKEN is not configured", async () => {
    hoisted.getEnvMock.mockReturnValue({
      INTERNAL_ADMIN_SECRET: internalSecret
    });
    const response = await POST(
      new Request("http://localhost/api/admin/test-qstash-enqueue", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-api-secret": internalSecret
        },
        body: "{}"
      })
    );
    expect(response.status).toBe(400);
  });

  it("publishes smoke target by default", async () => {
    const response = await POST(
      new Request("http://localhost/api/admin/test-qstash-enqueue", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-api-secret": internalSecret
        },
        body: "{}"
      })
    );
    expect(response.status).toBe(200);
    const json = (await response.json()) as { target?: string; messageId?: string };
    expect(json.target).toBe("smoke");
    expect(json.messageId).toBe("msg-1");
    expect(hoisted.publishQstashJobMock).toHaveBeenCalledWith(
      expect.objectContaining({
        destinationUrl: "https://app.example.test/api/admin/qstash-smoke",
        qstashToken: "qstash-token"
      })
    );
  });

  it("returns 400 for process-event target without ids", async () => {
    const response = await POST(
      new Request("http://localhost/api/admin/test-qstash-enqueue", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-api-secret": internalSecret
        },
        body: JSON.stringify({ target: "process-event" })
      })
    );
    expect(response.status).toBe(400);
  });

  it("publishes process-event target when webhookEventId is set", async () => {
    const response = await POST(
      new Request("http://localhost/api/admin/test-qstash-enqueue", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-api-secret": internalSecret
        },
        body: JSON.stringify({ target: "process-event", webhookEventId: "wev-1" })
      })
    );
    expect(response.status).toBe(200);
    expect(hoisted.publishQstashJobMock).toHaveBeenCalledWith(
      expect.objectContaining({
        destinationUrl: "https://app.example.test/api/jobs/process-event",
        payload: { webhookEventId: "wev-1" }
      })
    );
  });
});
