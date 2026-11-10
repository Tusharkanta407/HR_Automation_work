import {
  prisma,
  decryptCredential,
  encryptCredential,
  type PrismaClient,
} from "@hr-automation/db";
import type { GoogleOAuthSecret } from "./types";

const SKEW_MS = 60_000;

function parseSecret(encryptedData: string): GoogleOAuthSecret {
  const parsed = JSON.parse(decryptCredential(encryptedData)) as GoogleOAuthSecret;
  if (!parsed.clientId || !parsed.clientSecret) {
    throw new Error("Google credential is missing clientId/clientSecret");
  }
  if (!parsed.refreshToken && !parsed.accessToken) {
    throw new Error("Google credential has no access or refresh token — reconnect Google Workspace");
  }
  return parsed;
}

async function refreshAccessToken(secret: GoogleOAuthSecret): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  if (!secret.refreshToken) {
    throw new Error("Google refresh token missing — reconnect Google Workspace with offline consent");
  }
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: secret.clientId,
      client_secret: secret.clientSecret,
      refresh_token: secret.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const json = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !json.access_token) {
    throw new Error(
      json.error_description || json.error || "Failed to refresh Google access token",
    );
  }
  return {
    accessToken: json.access_token,
    expiresIn: Number(json.expires_in || 3600),
  };
}

/**
 * Returns a valid Google access token for the integration, refreshing and
 * persisting when near expiry. Never expose the result to the browser.
 */
export async function getValidAccessToken(
  integrationId: string,
  db: PrismaClient = prisma,
): Promise<{ accessToken: string; email?: string; accountIdentifier?: string | null }> {
  const integration = await db.integration.findUnique({
    where: { id: integrationId },
    include: { credentials: true },
  });
  if (!integration) throw new Error("Integration not found");
  if (integration.provider !== "GOOGLE" && integration.type !== "OAUTH") {
    throw new Error("Integration is not a Google Workspace OAuth connection");
  }

  const cred = integration.credentials[0];
  if (!cred?.encryptedData) {
    throw new Error("Google Workspace connection has no stored credentials — reconnect");
  }

  const secret = parseSecret(cred.encryptedData);
  const expired =
    !cred.expiresAt || cred.expiresAt.getTime() <= Date.now() + SKEW_MS || !secret.accessToken;

  if (!expired && secret.accessToken) {
    return {
      accessToken: secret.accessToken,
      email: secret.email,
      accountIdentifier: integration.accountIdentifier,
    };
  }

  const refreshed = await refreshAccessToken(secret);
  const expiresAt = new Date(Date.now() + refreshed.expiresIn * 1000);
  const nextSecret: GoogleOAuthSecret = {
    ...secret,
    accessToken: refreshed.accessToken,
  };

  await db.integrationCredential.update({
    where: { id: cred.id },
    data: {
      encryptedData: encryptCredential(JSON.stringify(nextSecret)),
      expiresAt,
      updatedAt: new Date(),
    },
  });

  return {
    accessToken: refreshed.accessToken,
    email: secret.email,
    accountIdentifier: integration.accountIdentifier,
  };
}

export async function googleFetch(
  accessToken: string,
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Bearer ${accessToken}`);
  return fetch(url, { ...init, headers });
}
