import { beforeEach, describe, expect, it, vi } from "vitest";

const hoisted = vi.hoisted(() => ({
  getEnvMock: vi.fn(),
  listAlertsMock: vi.fn(),
  getAlertByIdMock: vi.fn(),
  acknowledgeAlertMock: vi.fn()
}));

vi.mock("@/lib/env", () => ({
  getEnv: hoisted.getEnvMock
}));

vi.mock("@/lib/db/alerts", () => ({
  listAlerts: hoisted.listAlertsMock,
  getAlertById: hoisted.getAlertByIdMock,
  acknowledgeAlert: hoisted.acknowledgeAlertMock
}));

import { GET as getAlert } from "@/app/api/alerts/[id]/route";
import { POST as postAck } from "@/app/api/alerts/[id]/ack/route";
import { GET as listAlerts } from "@/app/api/alerts/route";

describe("alerts API routes", () => {
  const secret = "admin-secret";
  /** Valid RFC UUID for z.string().uuid() */
  const alertId = "550e8400-e29b-41d4-a716-446655440001";

  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.getEnvMock.mockReturnValue({
      INTERNAL_ADMIN_SECRET: secret
    });
  });

  function adminHeaders() {
    return { "x-internal-api-secret": secret };
  }

  describe("GET /api/alerts", () => {
    it("returns 401 without secret header", async () => {
      const res = await listAlerts(new Request("http://localhost/api/alerts"));
      expect(res.status).toBe(401);
    });

    it("lists alerts with optional tenant and cursor", async () => {
      hoisted.listAlertsMock.mockResolvedValue({
        items: [
          {
            id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
            organizationId: "org-1",
            xeroTenantId: "t-1",
            source: "process_event_diff",
            webhookEventId: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
            idempotencyKey: "idem",
            title: "Contact bank details changed (+1)",
            diff: {
              added: [],
              removed: [],
              changed: [],
              summary: {
                previousCount: 0,
                currentCount: 1,
                addedCount: 1,
                removedCount: 0,
                changedCount: 0
              }
            },
            acknowledgedAt: null,
            createdAt: "2026-05-02T12:00:00.000Z"
          }
        ],
        nextCursor: null
      });

      const res = await listAlerts(
        new Request("http://localhost/api/alerts?limit=10&tenantId=t-1", { headers: adminHeaders() })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.items).toHaveLength(1);
      expect(hoisted.listAlertsMock).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: "t-1", limit: 10 })
      );
    });

    it("returns 403 when tenantId conflicts with XERO_ALLOWED_TENANT_ID", async () => {
      hoisted.getEnvMock.mockReturnValue({
        INTERNAL_ADMIN_SECRET: secret,
        XERO_ALLOWED_TENANT_ID: "tenant-a"
      });

      const res = await listAlerts(
        new Request("http://localhost/api/alerts?tenantId=other", { headers: adminHeaders() })
      );
      expect(res.status).toBe(403);
      expect(hoisted.listAlertsMock).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/alerts/[id]", () => {
    it("returns 400 for invalid uuid", async () => {
      const res = await getAlert(new Request("http://localhost/api/alerts/not-a-uuid", { headers: adminHeaders() }), {
        params: Promise.resolve({ id: "not-a-uuid" })
      });
      expect(res.status).toBe(400);
    });

    it("returns 404 when missing", async () => {
      hoisted.getAlertByIdMock.mockResolvedValue(null);
      const res = await getAlert(new Request(`http://localhost/api/alerts/${alertId}`, { headers: adminHeaders() }), {
        params: Promise.resolve({ id: alertId })
      });
      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/alerts/[id]/ack", () => {
    it("is idempotent when already acknowledged", async () => {
      hoisted.getAlertByIdMock.mockResolvedValue({
        id: alertId,
        organizationId: "o1",
        xeroTenantId: "t1",
        source: "process_event_diff",
        webhookEventId: null,
        idempotencyKey: null,
        title: "x",
        diff: {
          added: [],
          removed: [],
          changed: [],
          summary: {
            previousCount: 0,
            currentCount: 0,
            addedCount: 0,
            removedCount: 0,
            changedCount: 0
          }
        },
        acknowledgedAt: "2026-01-01T00:00:00.000Z",
        createdAt: "2026-01-01T00:00:00.000Z"
      });

      const res = await postAck(new Request(`http://localhost/api/alerts/${alertId}/ack`, { headers: adminHeaders() }), {
        params: Promise.resolve({ id: alertId })
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.message).toBe("Alert already acknowledged");
      expect(hoisted.acknowledgeAlertMock).not.toHaveBeenCalled();
    });
  });
});
