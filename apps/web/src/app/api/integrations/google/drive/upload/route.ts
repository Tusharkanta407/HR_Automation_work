import { NextRequest, NextResponse } from "next/server";
import { getValidAccessToken, uploadFile } from "@hr-automation/google-workspace";
import { requireOwnedGoogleIntegration } from "@/lib/google-integration-access";

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

/**
 * POST /api/integrations/google/drive/upload
 * multipart form: integrationId + file (PDF preferred).
 * Uploads into the connected Google Drive and returns file meta.
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const integrationId = String(form.get("integrationId") || "");
    const owned = await requireOwnedGoogleIntegration(integrationId);
    if ("error" in owned && owned.error) return owned.error;

    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File too large (max 15MB)" },
        { status: 413 },
      );
    }

    const mimeType = file.type || "application/pdf";
    const ab = await file.arrayBuffer();
    const bytes = Buffer.from(ab);
    const { accessToken } = await getValidAccessToken(integrationId);
    const uploaded = await uploadFile(accessToken, {
      name: file.name || "document.pdf",
      mimeType,
      bytes,
    });

    return NextResponse.json({ ok: true, file: uploaded });
  } catch (err: any) {
    console.error("[drive/upload]", err);
    return NextResponse.json(
      { error: err.message || "Failed to upload to Drive" },
      { status: 500 },
    );
  }
}
