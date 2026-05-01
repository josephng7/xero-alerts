import { describe, expect, it, vi } from "vitest";

const hoisted = vi.hoisted(() => ({
  getDbMock: vi.fn()
}));

vi.mock("@/lib/db/index", () => ({
  getDb: hoisted.getDbMock
}));

import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("does not leak raw database error details", async () => {
    hoisted.getDbMock.mockReturnValue({
      execute: vi.fn().mockRejectedValue(new Error("db password auth failed for user"))
    });

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload).toEqual({
      status: "degraded",
      service: "xero-alerts",
      db: { status: "error", message: "db unavailable" }
    });
  });
});
