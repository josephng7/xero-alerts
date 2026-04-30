import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function deriveKey(keyMaterial: string): Buffer {
  const raw = Buffer.from(keyMaterial, "utf8");
  if (raw.length === KEY_LENGTH) {
    return raw;
  }
  return createHash("sha256").update(keyMaterial).digest();
}

/**
 * Encrypts a UTF-8 string with AES-256-GCM. Returns base64(iv || ciphertext || tag).
 */
export function encryptToken(plainText: string, keyMaterial: string): string {
  const key = deriveKey(keyMaterial);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, encrypted, tag]).toString("base64");
}

/**
 * Decrypts payload produced by `encryptToken`.
 */
export function decryptToken(payload: string, keyMaterial: string): string {
  const key = deriveKey(keyMaterial);
  const buf = Buffer.from(payload, "base64");
  if (buf.length < IV_LENGTH + TAG_LENGTH) {
    throw new Error("Invalid encrypted token payload");
  }
  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(buf.length - TAG_LENGTH);
  const data = buf.subarray(IV_LENGTH, buf.length - TAG_LENGTH);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
