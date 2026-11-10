import { googleFetch } from "./auth";
import { parseDriveFileId } from "./parse";
import type { SheetPreviewRow } from "./types";

function colLetterToIndex(letter: string): number {
  let n = 0;
  const s = letter.toUpperCase();
  for (let i = 0; i < s.length; i++) {
    n = n * 26 + (s.charCodeAt(i) - 64);
  }
  return n - 1;
}

/** Resolve a column selector: "A", "B", header name, or 0-based index string. */
export function resolveColumnIndex(
  headers: string[],
  selector: string | null | undefined,
): number | null {
  if (selector == null || selector === "") return null;
  const s = String(selector).trim();
  if (/^\d+$/.test(s)) {
    const idx = Number(s);
    return idx >= 0 && idx < headers.length ? idx : idx;
  }
  if (/^[A-Za-z]+$/.test(s) && s.length <= 3) {
    const idx = colLetterToIndex(s);
    return idx;
  }
  const lower = s.toLowerCase();
  const byHeader = headers.findIndex((h) => String(h).trim().toLowerCase() === lower);
  return byHeader >= 0 ? byHeader : null;
}

export async function getSheetValues(
  accessToken: string,
  spreadsheetId: string,
  range: string,
): Promise<string[][]> {
  const encoded = encodeURIComponent(range);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId,
  )}/values/${encoded}`;
  const res = await googleFetch(accessToken, url);
  const json = (await res.json().catch(() => ({}))) as {
    values?: string[][];
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(json.error?.message || `Sheets API error HTTP ${res.status}`);
  }
  return json.values || [];
}

export type BuildPreviewInput = {
  values: string[][];
  emailColumn: string;
  nameColumn?: string | null;
  driveFileColumn?: string | null;
  maxRows?: number;
};

export function buildSheetPreview(input: BuildPreviewInput): {
  headers: string[];
  rows: SheetPreviewRow[];
} {
  const values = input.values;
  if (!values.length) return { headers: [], rows: [] };

  const headers = values[0].map((h, i) => String(h ?? `Column ${i + 1}`));
  const emailIdx = resolveColumnIndex(headers, input.emailColumn);
  const nameIdx = resolveColumnIndex(headers, input.nameColumn || null);
  const driveIdx = resolveColumnIndex(headers, input.driveFileColumn || null);
  const max = Math.min(values.length - 1, input.maxRows ?? 50);

  const rows: SheetPreviewRow[] = [];
  for (let i = 1; i <= max; i++) {
    const row = values[i] || [];
    const cells: Record<string, string> = {};
    headers.forEach((h, idx) => {
      cells[h] = row[idx] != null ? String(row[idx]) : "";
    });
    const email =
      emailIdx != null && row[emailIdx] != null && String(row[emailIdx]).trim()
        ? String(row[emailIdx]).trim()
        : null;
    const name =
      nameIdx != null && row[nameIdx] != null && String(row[nameIdx]).trim()
        ? String(row[nameIdx]).trim()
        : null;
    const driveFileRaw =
      driveIdx != null && row[driveIdx] != null && String(row[driveIdx]).trim()
        ? String(row[driveIdx]).trim()
        : null;
    rows.push({
      rowIndex: i + 1,
      email,
      name,
      driveFileRaw,
      driveFileId: parseDriveFileId(driveFileRaw),
      cells,
    });
  }

  return { headers, rows };
}
