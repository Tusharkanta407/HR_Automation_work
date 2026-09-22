import { NextRequest, NextResponse } from "next/server";
import {
  prisma,
  encryptCredential,
  INTEGRATION_INCLUDE_SAFE,
  toSafeIntegration,
  defaultProviderForType,
  type CredentialType,
  type IntegrationType,
} from "@hr-automation/db";
import { getSessionUser } from "@/lib/server-auth";

function buildCredentialPlaintext(body: {
  authType?: string;
  apiKey?: string;
  token?: string;
  username?: string;
  password?: string;
  secret?: string;
  headerName?: string;
}): { type: CredentialType; plaintext: string } | null {
  const authType = (body.authType || "BEARER").toUpperCase();

  if (authType === "API_KEY" && body.apiKey) {
    return {
      type: "API_KEY",
      plaintext: JSON.stringify({
        apiKey: body.apiKey,
        headerName: body.headerName || "X-API-Key",
      }),
    };
  }
  if (authType === "BEARER" && (body.token || body.apiKey)) {
    return {
      type: "BEARER",
      plaintext: JSON.stringify({ token: body.token || body.apiKey }),
    };
  }
  if (authType === "BASIC" && body.username && body.password) {
    return {
      type: "BASIC",
      plaintext: JSON.stringify({
        username: body.username,
        password: body.password,
      }),
    };
  }
  if (authType === "SMTP" && body.username && body.password) {
    return {
      type: "SMTP",
      plaintext: JSON.stringify({
        username: body.username,
        password: body.password,
      }),
    };
  }
  if (authType === "CUSTOM_JSON" && body.secret) {
    return {
      type: "CUSTOM_JSON",
      plaintext: body.secret,
    };
  }
  // Webhook optional secret
  if (body.secret) {
    return {
      type: "CUSTOM_JSON",
      plaintext: JSON.stringify({ secret: body.secret }),
    };
  }
  return null;
}

/**
 * GET /api/integrations
 * List connections for the current user (secrets never returned).
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const typeFilter = req.nextUrl.searchParams.get("type");
    const where: { userId: string; type?: IntegrationType } = {
      userId: user.id,
    };
    if (
      typeFilter === "REST_API" ||
      typeFilter === "SMTP" ||
      typeFilter === "WEBHOOK"
    ) {
      where.type = typeFilter;
    }

    const rows = await prisma.integration.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: INTEGRATION_INCLUDE_SAFE,
    });

    return NextResponse.json({
      integrations: rows.map(toSafeIntegration),
    });
  } catch (err: any) {
    console.error("[GET /api/integrations] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to list connections" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integrations
 * Create a Connection (Integration + encrypted credential).
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const type = String(body.type || "").toUpperCase() as IntegrationType;
    if (!["REST_API", "SMTP", "WEBHOOK"].includes(type)) {
      return NextResponse.json(
        { error: "type must be REST_API, SMTP, or WEBHOOK" },
        { status: 400 }
      );
    }

    const name = String(body.name || "").trim();
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const provider =
      String(body.provider || "").trim() || defaultProviderForType(type);

    let baseUrl: string | null = null;
    let config: Record<string, unknown> = {};

    if (type === "REST_API") {
      baseUrl = String(body.baseUrl || "").trim().replace(/\/$/, "") || null;
      if (!baseUrl) {
        return NextResponse.json(
          { error: "baseUrl is required for REST_API" },
          { status: 400 }
        );
      }
      if (body.headers) {
        config.headers =
          typeof body.headers === "string"
            ? JSON.parse(body.headers)
            : body.headers;
      }
    } else if (type === "SMTP") {
      const host = String(body.host || "").trim();
      const port = Number(body.port || 587);
      if (!host) {
        return NextResponse.json(
          { error: "host is required for SMTP" },
          { status: 400 }
        );
      }
      baseUrl = `smtp://${host}:${port}`;
      config = {
        host,
        port,
        secure: Boolean(body.secure),
        from: String(body.from || "").trim(),
      };
      if (!config.from) {
        return NextResponse.json(
          { error: "from address is required for SMTP" },
          { status: 400 }
        );
      }
    } else if (type === "WEBHOOK") {
      baseUrl = String(body.baseUrl || body.url || "").trim() || null;
      if (!baseUrl) {
        return NextResponse.json(
          { error: "url is required for WEBHOOK" },
          { status: 400 }
        );
      }
    }

    const credInput =
      type === "SMTP"
        ? {
            authType: "SMTP",
            username: body.username,
            password: body.password,
          }
        : type === "WEBHOOK"
          ? { secret: body.secret }
          : {
              authType: body.authType || "BEARER",
              apiKey: body.apiKey,
              token: body.token,
              username: body.username,
              password: body.password,
              secret: body.secret,
              headerName: body.headerName,
            };

    const cred = buildCredentialPlaintext(credInput);
    if (type !== "WEBHOOK" && !cred) {
      return NextResponse.json(
        { error: "Valid credentials are required for this connection type" },
        { status: 400 }
      );
    }

    const created = await prisma.$transaction(async (tx) => {
      const integration = await tx.integration.create({
        data: {
          userId: user.id,
          name,
          type,
          provider,
          baseUrl,
          config: config as any,
          status: "ACTIVE",
        },
      });

      if (cred) {
        await tx.integrationCredential.create({
          data: {
            integrationId: integration.id,
            type: cred.type,
            encryptedData: encryptCredential(cred.plaintext),
          },
        });
      }

      return tx.integration.findUniqueOrThrow({
        where: { id: integration.id },
        include: INTEGRATION_INCLUDE_SAFE,
      });
    });

    return NextResponse.json(
      { integration: toSafeIntegration(created) },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[POST /api/integrations] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create connection" },
      { status: 500 }
    );
  }
}
