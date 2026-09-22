import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_LENGTH = 12;

function getKey(): Buffer {
  const secret =
    process.env.CREDENTIALS_SECRET || process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!secret || secret.length < 16) {
    throw new Error(
      "CREDENTIALS_SECRET (or CREDENTIAL_ENCRYPTION_KEY) must be set (min 16 chars). Used to encrypt IntegrationCredential.encryptedData.",
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

/** Safe Prisma include for Integration list/detail responses. */
export const INTEGRATION_INCLUDE_SAFE = {
  credentials: { select: CREDENTIAL_SELECT_SAFE },
} as const;

export type SafeCredentialDto = {
  id: string;
  integrationId: string;
  type: string;
  hasSecret: true;
  createdAt: string;
  updatedAt: string;
};

export type SafeIntegrationDto = {
  id: string;
  name: string;
  type: string;
  provider: string;
  baseUrl: string | null;
  config: unknown;
  status: string;
  createdAt: string;
  updatedAt: string;
  credentials: SafeCredentialDto[];
};

/**
 * Map a DB Integration (+ safe credential rows) to a browser-safe DTO.
 * Never includes encryptedData or plaintext secrets.
 */
export function toSafeIntegration(row: {
  id: string;
  name: string;
  type: string;
  provider: string;
  baseUrl: string | null;
  config: unknown;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  credentials?: Array<{
    id: string;
    integrationId: string;
    type: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
}): SafeIntegrationDto {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    provider: row.provider,
    baseUrl: row.baseUrl,
    config: row.config,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    credentials: (row.credentials ?? []).map((c) => ({
      id: c.id,
      integrationId: c.integrationId,
      type: c.type,
      hasSecret: true as const,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
  };
}

/** Default provider slug for a V1 transport type. */
export function defaultProviderForType(
  type: "REST_API" | "SMTP" | "WEBHOOK" | string,
): string {
  switch (type) {
    case "SMTP":
      return "CUSTOM_SMTP";
    case "WEBHOOK":
      return "CUSTOM_WEBHOOK";
    case "REST_API":
    default:
      return "CUSTOM_REST";
  }
}
