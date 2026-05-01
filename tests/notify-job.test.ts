import { beforeEach, describe, expect, it, vi } from "vitest";

const hoisted = vi.hoisted(() => ({
  recordNotifyDispatchIfNewMock: vi.fn(),
  removeNotifyDispatchByDedupeKeyMock: vi.fn(),
  sendTeamsNotificationMock: vi.fn(),
  sendEmailNotificationMock: vi.fn()
}));

vi.mock("@/lib/db/notify-dispatches", () => ({
  recordNotifyDispatchIfNew: hoisted.recordNotifyDispatchIfNewMock,
  removeNotifyDispatchByDedupeKey: hoisted.removeNotifyDispatchByDedupeKeyMock
}));

vi.mock("@/lib/notifications/senders", () => ({
  sendTeamsNotification: hoisted.sendTeamsNotificationMock,
  sendEmailNotification: hoisted.sendEmailNotificationMock
}));

import { runNotifyJob } from "@/lib/jobs/notify";

describe("runNotifyJob", () => {
  const env = {
    NODE_ENV: "test" as const,
    TEAMS_WEBHOOK_URL: "https://example.test/webhook",
    RESEND_API_KEY: "rk_test",
    ALERTS_FROM_EMAIL: "alerts@example.com",
    ALERTS_TO_EMAIL: "ops@example.com"
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns deduped when digest already exists", async () => {
    hoisted.recordNotifyDispatchIfNewMock.mockResolvedValue({
      inserted: false,
      dedupeKey: "dedupe-1"
    });

    const result = await runNotifyJob(
      {
        tenantId: "tenant-1",
        idempotencyKey: "evt-1",
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
      },
      env
    );

    expect(result.status).toBe("deduped");
    expect(hoisted.sendTeamsNotificationMock).not.toHaveBeenCalled();
    expect(hoisted.sendEmailNotificationMock).not.toHaveBeenCalled();
  });

  it("releases dedupe claim when no channel sends", async () => {
    hoisted.recordNotifyDispatchIfNewMock.mockResolvedValue({
      inserted: true,
      dedupeKey: "dedupe-2"
    });
    hoisted.sendTeamsNotificationMock.mockResolvedValue({
      status: "failed",
      reason: "teams-webhook-error"
    });
    hoisted.sendEmailNotificationMock.mockResolvedValue({
      status: "skipped",
      reason: "missing-email-env"
    });

    const result = await runNotifyJob(
      {
        tenantId: "tenant-2",
        idempotencyKey: "evt-2",
        diff: {
          added: ["acc-2"],
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
      },
      env
    );

    expect(result.status).toBe("no-delivery");
    expect(hoisted.removeNotifyDispatchByDedupeKeyMock).toHaveBeenCalledWith("dedupe-2");
  });
});
