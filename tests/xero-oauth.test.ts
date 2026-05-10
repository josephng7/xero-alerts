import { afterEach, describe, expect, it, vi } from "vitest";

import { buildXeroAuthorizeUrl, fetchAllConnections, refreshAccessToken } from "@/lib/xero/oauth";

describe("buildXeroAuthorizeUrl", () => {
  it("creates a valid authorize URL with required params", () => {
    const url = buildXeroAuthorizeUrl({
      clientId: "client-id",
      redirectUri: "http://localhost:3000/api/oauth/callback",
      state: "state-123"
    });
    const parsed = new URL(url);

    expect(parsed.origin).toBe("https://login.xero.com");
    expect(parsed.pathname).toBe("/identity/connect/authorize");
    expect(parsed.searchParams.get("response_type")).toBe("code");
    expect(parsed.searchParams.get("client_id")).toBe("client-id");
    expect(parsed.searchParams.get("redirect_uri")).toBe(
      "http://localhost:3000/api/oauth/callback"
    );
    expect(parsed.searchParams.get("state")).toBe("state-123");
    const scope = parsed.searchParams.get("scope");
    expect(scope).toContain("offline_access");
    expect(scope).toContain("accounting.contacts.read");
  });

  it("uses custom scope when provided", () => {
    const url = buildXeroAuthorizeUrl({
      clientId: "client-id",
      redirectUri: "http://localhost:3000/api/oauth/callback",
      state: "s",
      scope: "openid offline_access accounting.contacts.read"
    });
    expect(new URL(url).searchParams.get("scope")).toBe(
      "openid offline_access accounting.contacts.read"
    );
  });
});

describe("refreshAccessToken", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts refresh_token grant and returns token payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "new-access",
        refresh_token: "new-refresh",
        expires_in: 1800,
        token_type: "Bearer"
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    const token = await refreshAccessToken({
      clientId: "cid",
      clientSecret: "csecret",
      refreshToken: "old-refresh"
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://identity.xero.com/connect/token");
    expect(token.access_token).toBe("new-access");
    expect(token.refresh_token).toBe("new-refresh");
    expect(token.expires_in).toBe(1800);
  });
});

describe("fetchAllConnections", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns all connections with tenantId and tenantName", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { tenantId: "tid-1", tenantName: "Org Alpha" },
          { tenantId: "tid-2", tenantName: "Org Beta" }
        ]
      })
    );

    const connections = await fetchAllConnections("access-token");
    expect(connections).toHaveLength(2);
    expect(connections[0]).toEqual({ tenantId: "tid-1", tenantName: "Org Alpha" });
    expect(connections[1]).toEqual({ tenantId: "tid-2", tenantName: "Org Beta" });
  });

  it("falls back to 'Xero Organization' when tenantName is absent", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ tenantId: "tid-no-name" }]
      })
    );

    const connections = await fetchAllConnections("access-token");
    expect(connections[0]?.tenantName).toBe("Xero Organization");
  });

  it("throws when no valid connections are returned", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => []
      })
    );

    await expect(fetchAllConnections("access-token")).rejects.toThrow(
      "No Xero tenant connections found"
    );
  });

  it("throws on non-ok HTTP response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => "Unauthorized"
      })
    );

    await expect(fetchAllConnections("bad-token")).rejects.toThrow(
      "Xero connections lookup failed (401)"
    );
  });

  it("filters out items missing tenantId", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { tenantId: "tid-ok", tenantName: "Good Org" },
          { tenantName: "No Id Org" }
        ]
      })
    );

    const connections = await fetchAllConnections("access-token");
    expect(connections).toHaveLength(1);
    expect(connections[0]?.tenantId).toBe("tid-ok");
  });
});
