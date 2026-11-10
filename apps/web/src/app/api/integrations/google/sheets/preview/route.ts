import { NextRequest, NextResponse } from "next/server";
import {
  getValidAccessToken,
  getSheetValues,
  buildSheetPreview,
  parseSpreadsheetId,
  getFileMeta,
} from "@hr-automation/google-workspace";
import { requireOwnedGoogleIntegration } from "@/lib/google-integration-access";

const PREVIEW_CAP = 50;

/**
 * POST /api/integrations/google/sheets/preview
 * Fetch sheet rows and optionally resolve Drive file names for attachment preview.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const integrationId = String(body.integrationId || "");
    const owned = await requireOwnedGoogleIntegration(integrationId);
    if ("error" in owned && owned.error) return owned.error;

    const spreadsheetId = parseSpreadsheetId(
      body.spreadsheetId || body.spreadsheetUrl || "",
    );
    if (!spreadsheetId) {
      return NextResponse.json(
        { error: "spreadsheetId or spreadsheet URL is required" },
        { status: 400 },
      );
    }

    const sheetName = String(body.sheetName || body.tab || "Sheet1").trim();
    const range = String(body.range || `${sheetName}!A:Z`).trim();
    const emailColumn = String(body.emailColumn || "email").trim();
    const nameColumn = body.nameColumn ? String(body.nameColumn).trim() : null;
    const driveFileColumn = body.driveFileColumn
      ? String(body.driveFileColumn).trim()
      : null;
    const resolveFiles = Boolean(body.resolveFiles);
    const maxRows = Math.min(Number(body.maxRows || PREVIEW_CAP), PREVIEW_CAP);

    const { accessToken } = await getValidAccessToken(integrationId);
    const values = await getSheetValues(accessToken, spreadsheetId, range);
    const preview = buildSheetPreview({
      values,
      emailColumn,
      nameColumn,
      driveFileColumn,
      maxRows,
    });

    const rows = [];
    for (const row of preview.rows) {
      let attachmentName: string | null = null;
      let attachmentStatus: "ok" | "missing" | "n/a" | "error" = driveFileColumn
        ? row.driveFileId
          ? "ok"
          : "missing"
        : "n/a";

      if (resolveFiles && row.driveFileId) {
        try {
          const meta = await getFileMeta(accessToken, row.driveFileId);
          attachmentName = meta.name;
          attachmentStatus = "ok";
        } catch (err: any) {
          attachmentStatus = "error";
          attachmentName = err?.message || "Could not resolve file";
        }
      }

      rows.push({
        ...row,
        attachmentName,
        attachmentStatus,
      });
    }

    return NextResponse.json({
      ok: true,
      spreadsheetId,
      range,
      headers: preview.headers,
      rowCount: Math.max(0, values.length - 1),
      previewed: rows.length,
      rows,
    });
  } catch (err: any) {
    console.error("[sheets/preview]", err);
    return NextResponse.json(
      { error: err.message || "Failed to preview sheet" },
      { status: 500 },
    );
  }
}
