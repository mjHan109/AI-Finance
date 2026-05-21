/**
 * AES-256-GCM at-rest encryption for sensitive fields (memo).
 *
 * Requires ENCRYPTION_KEY env var: 64 hex characters (32 bytes).
 * Generate with: openssl rand -hex 32
 *
 * If ENCRYPTION_KEY is not set, values are stored/returned as plaintext.
 * Encrypted values are prefixed with "enc:" so the format is detectable.
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGO   = "aes-256-gcm";
const PREFIX = "enc:";

function getKey(): Buffer | null {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) return null;
  return Buffer.from(hex, "hex");
}

/** Encrypt a string. Returns plaintext unchanged if ENCRYPTION_KEY is not set. */
export function encrypt(plaintext: string): string {
  const key = getKey();
  if (!key) return plaintext;

  const iv         = randomBytes(12);
  const cipher     = createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag    = cipher.getAuthTag();

  return (
    PREFIX +
    iv.toString("base64") + ":" +
    authTag.toString("base64") + ":" +
    ciphertext.toString("base64")
  );
}

/** Decrypt a value. Returns null/original value if not encrypted or key unavailable. */
export function decrypt(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  if (!value.startsWith(PREFIX)) return value;

  const key = getKey();
  if (!key) return value;

  const parts = value.slice(PREFIX.length).split(":");
  if (parts.length !== 3) return value;

  try {
    const iv         = Buffer.from(parts[0], "base64");
    const authTag    = Buffer.from(parts[1], "base64");
    const ciphertext = Buffer.from(parts[2], "base64");

    const decipher = createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(authTag);

    return decipher.update(ciphertext).toString("utf8") + decipher.final("utf8");
  } catch {
    // Decryption failure → return as-is to avoid data loss
    return value;
  }
}
