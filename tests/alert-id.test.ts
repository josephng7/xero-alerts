import { describe, expect, it } from "vitest";

import { parseAlertId } from "@/lib/server/alert-id";

describe("parseAlertId", () => {
  it("accepts canonical UUIDs", () => {
    expect(parseAlertId("550e8400-e29b-41d4-a716-446655440000")).toBe(
      "550e8400-e29b-41d4-a716-446655440000"
    );
  });

  it("rejects path injection and non-UUID strings", () => {
    expect(parseAlertId("../../../evil")).toBeNull();
    expect(parseAlertId("not-a-uuid")).toBeNull();
    expect(parseAlertId("https://evil.example")).toBeNull();
  });
});
