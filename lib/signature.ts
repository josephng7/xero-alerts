import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Xero sends `x-xero-signature` as base64-encoded HMAC-SHA256 of the raw request body.
 */
export function computeXeroWebhookHmacSha256(rawBody: Buffer, signingKey: string): Buffer {
  return createHmac("sha256", signingKey).update(rawBody).digest();
}

export function verifyXeroWebhookSignature(
  rawBody: Buffer,
  signatureHeader: string | null | undefined,
  signingKey: string
): boolean {
  if (!signatureHeader) {
    return false;
  }

  let provided: Buffer;
  try {
    provided = Buffer.from(signatureHeader.trim(), "base64");
  } catch {
    return false;
  }

  const expected = computeXeroWebhookHmacSha256(rawBody, signingKey);

  if (provided.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(provided, expected);
}
