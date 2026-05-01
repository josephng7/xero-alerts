import { describe, expect, it } from "vitest";

import { computeWebhookIdempotencyKey } from "@/lib/db/webhook-events";

describe("computeWebhookIdempotencyKey", () => {
  it("is deterministic for identical payloads", () => {
    const payload = Buffer.from(JSON.stringify({ events: [{ id: "1" }] }), "utf8");
    const keyA = computeWebhookIdempotencyKey(payload);
    const keyB = computeWebhookIdempotencyKey(payload);
    expect(keyA).toBe(keyB);
  });

  it("differs when payload changes", () => {
    const a = Buffer.from(JSON.stringify({ events: [{ id: "1" }] }), "utf8");
    const b = Buffer.from(JSON.stringify({ events: [{ id: "2" }] }), "utf8");
    expect(computeWebhookIdempotencyKey(a)).not.toBe(computeWebhookIdempotencyKey(b));
  });
});
