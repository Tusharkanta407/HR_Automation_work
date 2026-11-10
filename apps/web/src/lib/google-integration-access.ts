import { NextResponse } from "next/server";
import { prisma } from "@hr-automation/db";
import { getSessionUser, type SessionUser } from "@/lib/server-auth";

type OwnedOk = {
  user: SessionUser;
  integration: { id: string; userId: string; provider: string; type: string };
};

type OwnedErr = { error: NextResponse };

/** Load a Google OAuth integration owned by the current session user. */
export async function requireOwnedGoogleIntegration(
  integrationId: string,
): Promise<OwnedOk | OwnedErr> {
  const user = await getSessionUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!integrationId) {
    return {
      error: NextResponse.json(
        { error: "integrationId is required" },
        { status: 400 },
      ),
    };
  }

  const integration = await prisma.integration.findFirst({
    where: {
      id: integrationId,
      userId: user.id,
      OR: [{ provider: "GOOGLE" }, { type: "OAUTH" }],
    },
  });

  if (!integration) {
    return {
      error: NextResponse.json(
        { error: "Google Workspace connection not found" },
        { status: 404 },
      ),
    };
  }

  return { user, integration };
}
