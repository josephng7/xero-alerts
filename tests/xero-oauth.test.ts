import { afterEach, describe, expect, it, vi } from "vitest";

import { buildXeroAuthorizeUrl, refreshAccessToken } from "@/lib/xero/oauth";

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
    expect(parsed.searchParams.get("scope")).toContain("offline_access");
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
