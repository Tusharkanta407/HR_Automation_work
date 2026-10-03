import { NextRequest, NextResponse } from "next/server";
import { prisma, encryptCredential, decryptCredential } from "@hr-automation/db";
import { getSessionUser } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const origin =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    req.nextUrl.origin ||
    "http://localhost:3000";

  const cleanOrigin = origin.replace(/\/$/, "");
  const connectionsUrl = `${cleanOrigin}/dashboard/connections`;

  if (error) {
    console.error("[Google OAuth Callback] Error returned from Google:", error);
    return NextResponse.redirect(
      `${connectionsUrl}?error=${encodeURIComponent(error)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${connectionsUrl}?error=missing_authorization_code`
    );
  }

  // Identify session user
  let user = await getSessionUser();
  if (!user && state) {
    try {
      const decoded = JSON.parse(
        Buffer.from(state, "base64url").toString("utf8")
      );
      if (decoded?.userId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: decoded.userId },
        });
        if (dbUser) {
          user = {
            id: dbUser.id,
            email: dbUser.email || "user@company.com",
            name: dbUser.name || "User",
          };
        }
      }
    } catch (e) {
      console.warn("[Google OAuth Callback] Could not decode state:", e);
    }
  }

  if (!user) {
    return NextResponse.redirect(`${cleanOrigin}/login`);
  }

  const clientId =
    process.env.GOOGLE_WORKSPACE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret =
    process.env.GOOGLE_WORKSPACE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      `${connectionsUrl}?error=missing_server_credentials`
    );
  }

  const redirectUri = `${cleanOrigin}/api/integrations/google/callback`;

  try {
    // 1. Exchange authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("[Google OAuth Callback] Token exchange failed:", tokenData);
      return NextResponse.redirect(
        `${connectionsUrl}?error=${encodeURIComponent(
          tokenData.error_description || tokenData.error || "Token exchange failed"
        )}`
      );
    }

    // 2. Fetch authenticated Google profile
    const profileRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    );
    const profile = await profileRes.json().catch(() => ({}));
    const accountEmail = profile.email || user.email;

    const grantedScopes = tokenData.scope
      ? tokenData.scope.split(" ")
      : [];

    // 3. Find existing Google integration for this user (if re-authorizing)
    const existing = await prisma.integration.findFirst({
      where: {
        userId: user.id,
        provider: "GOOGLE",
      },
      include: {
        credentials: true,
      },
    });

    // Handle refresh token retention if Google didn't return a new one on re-auth
    let refreshToken = tokenData.refresh_token;
    if (!refreshToken && existing?.credentials?.[0]?.encryptedData) {
      try {
        const decrypted = JSON.parse(
          decryptCredential(existing.credentials[0].encryptedData)
        );
        refreshToken = decrypted.refreshToken;
      } catch (err) {
        console.warn("[Google OAuth Callback] Could not extract previous refresh token:", err);
      }
    }

    if (!refreshToken) {
      console.warn(
        "[Google OAuth Callback] Warning: No refresh token returned. User may need to revoke app access in Google Security settings to re-consent."
      );
    }

    const encryptedSecret = encryptCredential(
      JSON.stringify({
        refreshToken: refreshToken || "",
        accessToken: tokenData.access_token,
        clientId,
        clientSecret,
        email: accountEmail,
      })
    );

    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : new Date(Date.now() + 3600 * 1000);

    // 4. Upsert Integration and Credential in Neon PostgreSQL
    if (existing) {
      await prisma.$transaction(async (tx) => {
        await tx.integration.update({
          where: { id: existing.id },
          data: {
            name: `Google Workspace (${accountEmail})`,
            type: "OAUTH",
            provider: "GOOGLE",
            accountIdentifier: accountEmail,
            baseUrl: "https://www.googleapis.com",
            status: "ACTIVE",
            metadata: {
              name: profile.name,
              picture: profile.picture,
              hd: profile.hd,
            },
            config: {
              email: accountEmail,
              scopes: grantedScopes,
            },
            updatedAt: new Date(),
          },
        });

        if (existing.credentials.length > 0) {
          await tx.integrationCredential.update({
            where: { id: existing.credentials[0].id },
            data: {
              type: "OAUTH2",
              encryptedData: encryptedSecret,
              scopes: grantedScopes,
              expiresAt,
              updatedAt: new Date(),
            },
          });
        } else {
          await tx.integrationCredential.create({
            data: {
              integrationId: existing.id,
              type: "OAUTH2",
              encryptedData: encryptedSecret,
              scopes: grantedScopes,
              expiresAt,
            },
          });
        }
      });
    } else {
      await prisma.$transaction(async (tx) => {
        const created = await tx.integration.create({
          data: {
            userId: user!.id,
            name: `Google Workspace (${accountEmail})`,
            type: "OAUTH",
            provider: "GOOGLE",
            accountIdentifier: accountEmail,
            baseUrl: "https://www.googleapis.com",
            status: "ACTIVE",
            metadata: {
              name: profile.name,
              picture: profile.picture,
              hd: profile.hd,
            },
            config: {
              email: accountEmail,
              scopes: grantedScopes,
            },
          },
        });

        await tx.integrationCredential.create({
          data: {
            integrationId: created.id,
            type: "OAUTH2",
            encryptedData: encryptedSecret,
            scopes: grantedScopes,
            expiresAt,
          },
        });
      });
    }

    return NextResponse.redirect(`${connectionsUrl}?success=google_connected`);
  } catch (err: any) {
    console.error("[Google OAuth Callback] Internal Error:", err);
    return NextResponse.redirect(
      `${connectionsUrl}?error=${encodeURIComponent(
        err.message || "Failed to process Google authorization"
      )}`
    );
  }
}
