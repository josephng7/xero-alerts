import { describe, expect, it } from "vitest";

import { parseEnv } from "@/lib/env";

describe("parseEnv", () => {
  it("accepts a minimal valid payload", () => {
    const parsed = parseEnv({ NODE_ENV: "development" });

    expect(parsed.NODE_ENV).toBe("development");
  });

  it("rejects malformed URL values", () => {
    expect(() => parseEnv({ NODE_ENV: "development", QSTASH_URL: "not-a-url" })).toThrow(
      "Invalid environment configuration"
    );
  });
});
