import { NextRequest, NextResponse } from "next/server";
import {
  getValidAccessToken,
  getFileMeta,
  parseDriveFileId,
} from "@hr-automation/google-workspace";
import { requireOwnedGoogleIntegration } from "@/lib/google-integration-access";

/**
 * POST /api/integrations/google/drive/resolve
 * Validate a Drive file ID/URL → metadata (no bytes).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const integrationId = String(body.integrationId || "");
    const owned = await requireOwnedGoogleIntegration(integrationId);
    if ("error" in owned && owned.error) return owned.error;

    const fileInput = String(body.fileId || body.url || body.driveFile || "");
    if (!parseDriveFileId(fileInput)) {
      return NextResponse.json(
        { error: "Valid Drive file id or URL is required" },
        { status: 400 },
      );
    }

    const { accessToken } = await getValidAccessToken(integrationId);
    const file = await getFileMeta(accessToken, fileInput);
    return NextResponse.json({ ok: true, file });
  } catch (err: any) {
    console.error("[drive/resolve]", err);
    return NextResponse.json(
      { error: err.message || "Failed to resolve Drive file" },
      { status: 500 },
    );
  }
}
