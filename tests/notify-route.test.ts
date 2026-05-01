import { beforeEach, describe, expect, it, vi } from "vitest";

const hoisted = vi.hoisted(() => ({
  getEnvMock: vi.fn(),
  runNotifyJobMock: vi.fn()
}));

vi.mock("@/lib/env", () => ({
  getEnv: hoisted.getEnvMock
}));

vi.mock("@/lib/jobs/notify", async () => {
  const actual = await vi.importActual<typeof import("@/lib/jobs/notify")>("@/lib/jobs/notify");
  return {
    ...actual,
    runNotifyJob: hoisted.runNotifyJobMock
  };
});

import { POST } from "@/app/api/jobs/notify/route";

const actionablePayload = {
  tenantId: "tenant-1",
  idempotencyKey: "idem-1",
  diff: {
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
  }
};

describe("POST /api/jobs/notify", () => {
  const internalSecret = "internal-secret";

  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.getEnvMock.mockReturnValue({
      INTERNAL_API_SECRET: internalSecret
    });
  });

  it("returns 401 when internal auth header is missing", async () => {
    const response = await POST(
      new Request("http://localhost/api/jobs/notify", {
        method: "POST",
        body: JSON.stringify(actionablePayload)
      })
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: "Unauthorized internal request" });
    expect(hoisted.runNotifyJobMock).not.toHaveBeenCalled();
  });

  it("returns 403 when internal auth header is invalid", async () => {
    const response = await POST(
      new Request("http://localhost/api/jobs/notify", {
        method: "POST",
        headers: {
          "x-internal-api-secret": "bad-secret"
        },
        body: JSON.stringify(actionablePayload)
      })
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ message: "Forbidden internal request" });
    expect(hoisted.runNotifyJobMock).not.toHaveBeenCalled();
  });

  it("passes no-op summary payload to notify runner", async () => {
    hoisted.runNotifyJobMock.mockResolvedValue({
      message: "No actionable changes; notification skipped",
      status: "no-op",
      tenantId: "tenant-1"
    });

    const response = await POST(
      new Request("http://localhost/api/jobs/notify", {
        method: "POST",
        headers: {
          "x-internal-api-secret": internalSecret
        },
        body: JSON.stringify({
          ...actionablePayload,
          diff: {
            ...actionablePayload.diff,
            summary: {
              previousCount: 1,
              currentCount: 1,
              addedCount: 0,
              removedCount: 0,
              changedCount: 0
            }
          }
        })
      })
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.status).toBe("no-op");
    expect(hoisted.runNotifyJobMock).toHaveBeenCalledTimes(1);
  });

  it("returns sent response for actionable payload", async () => {
    hoisted.runNotifyJobMock.mockResolvedValue({
      message: "Notify job completed",
      status: "sent",
      tenantId: "tenant-1",
      idempotencyKey: "idem-1",
      channels: {
        teams: { status: "sent" },
        email: { status: "sent" }
      }
    });

    const response = await POST(
      new Request("http://localhost/api/jobs/notify", {
        method: "POST",
        headers: {
          "x-internal-api-secret": internalSecret
        },
        body: JSON.stringify(actionablePayload)
      })
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.status).toBe("sent");
    expect(json.tenantId).toBe("tenant-1");
    expect(hoisted.runNotifyJobMock).toHaveBeenCalledTimes(1);
  });
});
