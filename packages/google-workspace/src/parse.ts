/** Extract a Google Drive file ID from a raw ID or common Drive URL shapes. */
export function parseDriveFileId(input: string | null | undefined): string | null {
  if (!input) return null;
  const raw = String(input).trim();
  if (!raw) return null;

  // Already a bare file id (Drive ids are typically 25–44 alphanumeric / _ / -)
  if (/^[a-zA-Z0-9_-]{20,}$/.test(raw) && !raw.includes("/") && !raw.includes("?")) {
    return raw;
  }

  try {
    const url = new URL(raw);
    const byPath = url.pathname.match(/\/(?:file|document|spreadsheets|presentation)\/d\/([a-zA-Z0-9_-]+)/);
    if (byPath?.[1]) return byPath[1];

    const idParam = url.searchParams.get("id");
    if (idParam) return idParam;

    const openMatch = raw.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (openMatch?.[1]) return openMatch[1];
  } catch {
    const loose = raw.match(/\/d\/([a-zA-Z0-9_-]+)/) || raw.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (loose?.[1]) return loose[1];
  }

  return null;
}

/** Extract spreadsheet ID from a Sheets URL or bare id. */
export function parseSpreadsheetId(input: string | null | undefined): string | null {
  if (!input) return null;
  const raw = String(input).trim();
  if (!raw) return null;
  if (/^[a-zA-Z0-9_-]{20,}$/.test(raw) && !raw.includes("/")) return raw;
  const m = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return m?.[1] ?? parseDriveFileId(raw);
}
