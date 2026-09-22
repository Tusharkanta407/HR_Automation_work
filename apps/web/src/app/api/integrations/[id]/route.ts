import { NextRequest, NextResponse } from "next/server";
import {
  prisma,
  encryptCredential,
  INTEGRATION_INCLUDE_SAFE,
  toSafeIntegration,
  defaultProviderForType,
  type CredentialType,
} from "@hr-automation/db";
import { getSessionUser } from "@/lib/server-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function buildCredentialPlaintext(body: {
  authType?: string;
  apiKey?: string;
  token?: string;
  username?: string;
  password?: string;
  secret?: string;
  headerName?: string;
}): { type: CredentialType; plaintext: string } | null {
  const authType = (body.authType || "").toUpperCase();

  if (authType === "API_KEY" || (body.apiKey && !body.token && !body.username)) {
    if (body.apiKey) {
      return {
        type: "API_KEY",
        plaintext: JSON.stringify({
          apiKey: body.apiKey,
          headerName: body.headerName || "X-API-Key",
        }),
      };
    }
  }

  if (authType === "BEARER" || body.token) {
    const token = body.token || body.apiKey;
    if (token) {
      return {
        type: "BEARER",
        plaintext: JSON.stringify({ token }),
      };
    }
  }

  if (body.username && body.password) {
    if (authType === "SMTP") {
      return {
        type: "SMTP",
        plaintext: JSON.stringify({
          username: body.username,
          password: body.password,
        }),
      };
    }
    return {
      type: "BASIC",
      plaintext: JSON.stringify({
        username: body.username,
        password: body.password,
      }),
    };
  }

  if (body.secret) {
    return {
      type: "CUSTOM_JSON",
      plaintext: JSON.stringify({ secret: body.secret }),
    };
  }

  return null;
}

async function getOwnedIntegration(id: string, userId: string) {
  return prisma.integration.findFirst({
    where: { id, userId },
    include: INTEGRATION_INCLUDE_SAFE,
  });
}

/**
 * GET /api/integrations/[id]
 */
export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const row = await getOwnedIntegration(id, user.id);
    if (!row) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    return NextResponse.json({ integration: toSafeIntegration(row) });
  } catch (err: any) {
    console.error("[GET /api/integrations/[id]] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch connection" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/integrations/[id]
 * Update metadata / config. Secrets only replaced when new values are provided.
 */
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const existing = await prisma.integration.findFirst({
      where: { id, userId: user.id },
      include: { credentials: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const data: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) {
        return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
      }
      data.name = name;
    }
    if (body.status !== undefined) {
      data.status = body.status;
    }
    if (body.provider !== undefined) {
      data.provider =
        String(body.provider).trim() ||
        defaultProviderForType(existing.type);
    }

    if (existing.type === "REST_API") {
      if (body.baseUrl !== undefined) {
        data.baseUrl =
          String(body.baseUrl || "").trim().replace(/\/$/, "") || null;
      }
      if (body.headers !== undefined) {
        const prev = (existing.config || {}) as Record<string, unknown>;
        data.config = {
          ...prev,
          headers:
            typeof body.headers === "string"
              ? JSON.parse(body.headers || "{}")
              : body.headers,
        };
      }
    } else if (existing.type === "SMTP") {
      const prev = (existing.config || {}) as Record<string, unknown>;
      const host =
        body.host !== undefined ? String(body.host).trim() : String(prev.host || "");
      const port =
        body.port !== undefined ? Number(body.port) : Number(prev.port || 587);
      const from =
        body.from !== undefined
          ? String(body.from).trim()
          : String(prev.from || "");
      const secure =
        body.secure !== undefined ? Boolean(body.secure) : Boolean(prev.secure);
      data.baseUrl = host ? `smtp://${host}:${port}` : existing.baseUrl;
      data.config = { host, port, secure, from };
    } else if (existing.type === "WEBHOOK") {
      if (body.baseUrl !== undefined || body.url !== undefined) {
        data.baseUrl =
          String(body.baseUrl || body.url || "").trim() || null;
      }
    }

    const credInput =
      existing.type === "SMTP"
        ? {
            authType: "SMTP",
            username: body.username,
            password: body.password,
          }
        : existing.type === "WEBHOOK"
          ? { secret: body.secret }
          : {
              authType: body.authType,
              apiKey: body.apiKey,
              token: body.token,
              username: body.username,
              password: body.password,
              secret: body.secret,
              headerName: body.headerName,
            };

    const newCred = buildCredentialPlaintext(credInput);

    const updated = await prisma.$transaction(async (tx) => {
      await tx.integration.update({
        where: { id },
        data: data as any,
      });

      if (newCred) {
        const current = existing.credentials[0];
        if (current) {
          await tx.integrationCredential.update({
            where: { id: current.id },
            data: {
              type: newCred.type,
              encryptedData: encryptCredential(newCred.plaintext),
            },
          });
        } else {
          await tx.integrationCredential.create({
            data: {
              integrationId: id,
              type: newCred.type,
              encryptedData: encryptCredential(newCred.plaintext),
            },
          });
        }
      }

      return tx.integration.findUniqueOrThrow({
        where: { id },
        include: INTEGRATION_INCLUDE_SAFE,
      });
    });

    return NextResponse.json({ integration: toSafeIntegration(updated) });
  } catch (err: any) {
    console.error("[PATCH /api/integrations/[id]] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update connection" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/integrations/[id]
 */
export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const existing = await prisma.integration.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    await prisma.integration.delete({ where: { id } });
    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error("[DELETE /api/integrations/[id]] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete connection" },
      { status: 500 }
    );
  }
}
