import { NextRequest, NextResponse } from "next/server";
import net from "node:net";
import {
  prisma,
  decryptCredential,
  CREDENTIAL_SELECT_SAFE,
} from "@hr-automation/db";
import { getSessionUser } from "@/lib/server-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function authHeadersFromCredential(
  type: string,
  plaintext: string
): Record<string, string> {
  try {
    const parsed = JSON.parse(plaintext) as Record<string, string>;
    if (type === "BEARER" && parsed.token) {
      return { Authorization: `Bearer ${parsed.token}` };
    }
    if (type === "API_KEY" && parsed.apiKey) {
      return { [parsed.headerName || "X-API-Key"]: parsed.apiKey };
    }
    if (type === "BASIC" && parsed.username && parsed.password) {
      const token = Buffer.from(
        `${parsed.username}:${parsed.password}`
      ).toString("base64");
      return { Authorization: `Basic ${token}` };
    }
    if (parsed.secret) {
      return { "X-Webhook-Secret": parsed.secret };
    }
  } catch {
    /* plaintext may be raw CUSTOM_JSON */
  }
  return {};
}

async function probeHttp(
  url: string,
  headers: Record<string, string>
): Promise<{ success: boolean; message: string }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...headers,
      },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timer);

    if (res.status >= 500) {
      return {
        success: false,
        message: `Server responded with HTTP ${res.status}`,
      };
    }
    // 401/403 still prove reachability + auth plumbing; treat 2xx–4xx as reachable
    if (res.status === 401 || res.status === 403) {
      return {
        success: true,
        message: `Reached endpoint (HTTP ${res.status}) — check credentials if calls fail at runtime`,
      };
    }
    return {
      success: true,
      message: `Connection successful (HTTP ${res.status})`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.name === "AbortError"
        ? "Connection timed out"
        : err?.message || "Failed to reach endpoint",
    };
  }
}

function probeTcp(
  host: string,
  port: number
): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port }, () => {
      socket.end();
      resolve({
        success: true,
        message: `SMTP host reachable at ${host}:${port}`,
      });
    });
    socket.setTimeout(8000);
    socket.on("timeout", () => {
      socket.destroy();
      resolve({ success: false, message: "SMTP connection timed out" });
    });
    socket.on("error", (err) => {
      resolve({
        success: false,
        message: err.message || "SMTP host unreachable",
      });
    });
  });
}

/**
 * POST /api/integrations/[id]/test
 * Decrypts credential server-side, probes the remote system, never returns secrets.
 */
export async function POST(_req: NextRequest, context: RouteContext) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const integration = await prisma.integration.findFirst({
      where: { id, userId: user.id },
      include: {
        credentials: { select: { ...CREDENTIAL_SELECT_SAFE, encryptedData: true } },
      },
    });

    if (!integration) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    const cred = integration.credentials[0];
    let headers: Record<string, string> = {};
    if (cred?.encryptedData) {
      try {
        const plaintext = decryptCredential(cred.encryptedData);
        headers = authHeadersFromCredential(cred.type, plaintext);
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          message: err.message || "Failed to decrypt credentials",
        });
      }
    }

    let result: { success: boolean; message: string };

    if (integration.type === "SMTP") {
      const cfg = (integration.config || {}) as { host?: string; port?: number };
      const host = cfg.host || "";
      const port = Number(cfg.port || 587);
      if (!host) {
        result = { success: false, message: "SMTP host is not configured" };
      } else {
        result = await probeTcp(host, port);
      }
    } else {
      const url = integration.baseUrl;
      if (!url) {
        result = { success: false, message: "URL / baseUrl is not configured" };
      } else {
        result = await probeHttp(url, headers);
      }
    }

    // Reflect probe outcome on status (soft signal)
    await prisma.integration.update({
      where: { id },
      data: { status: result.success ? "ACTIVE" : "ERROR" },
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[POST /api/integrations/[id]/test] Error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Test failed" },
      { status: 500 }
    );
  }
}
