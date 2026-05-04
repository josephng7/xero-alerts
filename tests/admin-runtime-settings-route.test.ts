import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const hoisted = vi.hoisted(() => ({
  getEnvMock: vi.fn(),
  getPipelineDebugRowMock: vi.fn(),
  setPipelineDebugEnabledMock: vi.fn()
}));

vi.mock("@/lib/env", () => ({
  getEnv: hoisted.getEnvMock
}));

vi.mock("@/lib/db/app-runtime-settings", () => ({
  getPipelineDebugRow: hoisted.getPipelineDebugRowMock,
  setPipelineDebugEnabled: hoisted.setPipelineDebugEnabledMock,
  getPipelineDebugEnabledCached: vi.fn(),
  invalidatePipelineDebugCache: vi.fn()
}));

import { GET, PATCH } from "@/app/api/admin/runtime-settings/route";

describe("admin runtime-settings", () => {
  const internalSecret = "internal-secret";
  const prevDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DATABASE_URL = "postgres://localhost:5432/test";
    hoisted.getEnvMock.mockReturnValue({ INTERNAL_ADMIN_SECRET: internalSecret });
  });

  afterEach(() => {
    process.env.DATABASE_URL = prevDatabaseUrl;
  });

  it("GET returns 401 without internal secret", async () => {
    const res = await GET(new Request("http://localhost/api/admin/runtime-settings"));
    expect(res.status).toBe(401);
  });

  it("GET returns current row", async () => {
    hoisted.getPipelineDebugRowMock.mockResolvedValue({
      pipelineDebug: true,
      updatedAt: new Date("2026-05-04T12:00:00.000Z")
    });
    const res = await GET(
      new Request("http://localhost/api/admin/runtime-settings", {
        headers: { "x-internal-api-secret": internalSecret }
      })
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      pipelineDebug?: boolean;
      envOverride?: boolean;
    };
    expect(json.pipelineDebug).toBe(true);
    expect(json.envOverride).toBe(false);
  });

  it("PATCH updates pipelineDebug", async () => {
    hoisted.setPipelineDebugEnabledMock.mockResolvedValue(undefined);
    hoisted.getPipelineDebugRowMock.mockResolvedValue({
      pipelineDebug: false,
      updatedAt: new Date("2026-05-04T12:01:00.000Z")
    });
    const res = await PATCH(
      new Request("http://localhost/api/admin/runtime-settings", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-internal-api-secret": internalSecret
        },
        body: JSON.stringify({ pipelineDebug: false })
      })
    );
    expect(res.status).toBe(200);
    expect(hoisted.setPipelineDebugEnabledMock).toHaveBeenCalledWith(false);
  });
});
