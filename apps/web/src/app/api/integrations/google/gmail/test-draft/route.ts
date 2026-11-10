import { NextRequest, NextResponse } from "next/server";
import {
  getValidAccessToken,
  downloadFile,
  sendOrDraftEmail,
  parseDriveFileId,
} from "@hr-automation/google-workspace";
import { requireOwnedGoogleIntegration } from "@/lib/google-integration-access";

/**
 * POST /api/integrations/google/gmail/test-draft
 * Create one Gmail draft for smoke-testing offer/document email.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const integrationId = String(body.integrationId || "");
    const owned = await requireOwnedGoogleIntegration(integrationId);
    if ("error" in owned && owned.error) return owned.error;

    const to = String(body.to || "").trim();
    if (!to.includes("@")) {
      return NextResponse.json({ error: "Valid to email is required" }, { status: 400 });
    }

    const subject = String(body.subject || "HR document (test draft)");
    const message = String(
      body.message || body.body || "This is a test draft from HR Automation.",
    );
    const driveFileId = parseDriveFileId(body.driveFileId || body.fileId || "");

    const { accessToken } = await getValidAccessToken(integrationId);
    const attachments = [];
    if (driveFileId) {
      const file = await downloadFile(accessToken, driveFileId);
      attachments.push({
        filename: file.name,
        mimeType: file.mimeType || "application/pdf",
        bytes: file.bytes,
      });
    }

    const result = await sendOrDraftEmail(accessToken, {
      to,
      subject,
      bodyText: message,
      bodyHtml: `<pre style="font-family:inherit">${message.replace(/</g, "&lt;")}</pre>`,
      attachments,
      asDraft: true,
    });

    return NextResponse.json({ ok: true, draft: result });
  } catch (err: any) {
    console.error("[gmail/test-draft]", err);
    return NextResponse.json(
      { error: err.message || "Failed to create test draft" },
      { status: 500 },
    );
  }
}
