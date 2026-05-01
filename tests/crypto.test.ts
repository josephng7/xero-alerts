import { describe, expect, it } from "vitest";

import { decryptToken, encryptToken } from "@/lib/crypto";

describe("encryptToken / decryptToken", () => {
  it("round-trips UTF-8 plaintext", () => {
    const key = "a".repeat(32);
    const plain = "access-token-value";
    const enc = encryptToken(plain, key);
    expect(decryptToken(enc, key)).toBe(plain);
  });

  it("fails on tampered ciphertext", () => {
    const key = "a".repeat(32);
    const enc = encryptToken("secret", key);
    const buf = Buffer.from(enc, "base64");
    buf[buf.length - 1] ^= 1;
    const tampered = buf.toString("base64");
    expect(() => decryptToken(tampered, key)).toThrow();
  });
});
