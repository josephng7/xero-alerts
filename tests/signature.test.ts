import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import { verifyXeroWebhookSignature } from "@/lib/signature";

describe("verifyXeroWebhookSignature", () => {
  it("accepts a valid base64 HMAC-SHA256 signature", () => {
    const body = Buffer.from('{"events":[]}', "utf8");
    const key = "test-signing-key";
    const expected = createHmac("sha256", key).update(body).digest("base64");

    expect(verifyXeroWebhookSignature(body, expected, key)).toBe(true);
  });

  it("rejects missing header", () => {
    const body = Buffer.from("{}", "utf8");
    expect(verifyXeroWebhookSignature(body, null, "key")).toBe(false);
  });

  it("rejects invalid base64", () => {
    const body = Buffer.from("{}", "utf8");
    expect(verifyXeroWebhookSignature(body, "not!!!valid-base64", "key")).toBe(false);
  });

  it("rejects wrong key", () => {
    const body = Buffer.from("payload", "utf8");
    const sig = createHmac("sha256", "correct").update(body).digest("base64");
    expect(verifyXeroWebhookSignature(body, sig, "wrong")).toBe(false);
  });
});
