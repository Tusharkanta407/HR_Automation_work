import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_LENGTH = 12;

function getKey(): Buffer {
  const secret = process.env.CREDENTIALS_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "CREDENTIALS_SECRET must be set (min 16 chars). Used to encrypt IntegrationCredential.encryptedData.",
    );
  }
  // Derive a stable 32-byte key from the secret
  return createHash("sha256").update(secret).digest();
}

/**
 * Encrypt credential plaintext for storage in IntegrationCredential.encryptedData.
 * Format: base64(iv | authTag | ciphertext)
 */
export function encryptCredential(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

/**
 * Decrypt IntegrationCredential.encryptedData.
 * Call ONLY in worker / server routes that invoke external APIs.
 * NEVER send the result to the browser.
 */
export function decryptCredential(encryptedData: string): string {
  const buf = Buffer.from(encryptedData, "base64");
  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + 16);
  const data = buf.subarray(IV_LENGTH + 16);
  const decipher = createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

/**
 * Safe Prisma select for IntegrationCredential in client-facing APIs.
 * Omits encryptedData entirely.
 */
export const CREDENTIAL_SELECT_SAFE = {
  id: true,
  integrationId: true,
  type: true,
  createdAt: true,
  updatedAt: true,
} as const;
