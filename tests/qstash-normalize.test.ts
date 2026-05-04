import { describe, expect, it } from "vitest";

import { normalizeQstashApiOrigin } from "@/lib/queue/qstash";

describe("normalizeQstashApiOrigin", () => {
  it("returns origin only for regional host", () => {
    expect(normalizeQstashApiOrigin("https://qstash-us-east-1.upstash.io")).toBe(
      "https://qstash-us-east-1.upstash.io"
    );
  });

  it("strips /v2/publish suffix (legacy misconfiguration)", () => {
    expect(normalizeQstashApiOrigin("https://qstash.upstash.io/v2/publish/")).toBe(
      "https://qstash.upstash.io"
    );
    expect(normalizeQstashApiOrigin("https://qstash-us-east-1.upstash.io/v2/publish")).toBe(
      "https://qstash-us-east-1.upstash.io"
    );
  });

  it("adds https when scheme omitted", () => {
    expect(normalizeQstashApiOrigin("qstash-us-east-1.upstash.io")).toBe("https://qstash-us-east-1.upstash.io");
  });

  it("trims whitespace and trailing slashes on origin", () => {
    expect(normalizeQstashApiOrigin("  https://qstash.upstash.io/  ")).toBe("https://qstash.upstash.io");
  });
});
