import { googleFetch } from "./auth";
import { parseDriveFileId } from "./parse";
import type { DriveFileBytes, DriveFileMeta } from "./types";

export async function getFileMeta(
  accessToken: string,
  fileIdOrUrl: string,
): Promise<DriveFileMeta> {
  const fileId = parseDriveFileId(fileIdOrUrl);
  if (!fileId) throw new Error("Could not parse Google Drive file id from input");

  const fields = encodeURIComponent("id,name,mimeType,webViewLink,size");
  const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
    fileId,
  )}?fields=${fields}&supportsAllDrives=true`;
  const res = await googleFetch(accessToken, url);
  const json = (await res.json().catch(() => ({}))) as DriveFileMeta & {
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(json.error?.message || `Drive meta error HTTP ${res.status}`);
  }
  return {
    id: json.id,
    name: json.name,
    mimeType: json.mimeType,
    webViewLink: json.webViewLink,
    size: json.size,
  };
}

export async function downloadFile(
  accessToken: string,
  fileIdOrUrl: string,
): Promise<DriveFileBytes> {
  const meta = await getFileMeta(accessToken, fileIdOrUrl);
  const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
    meta.id,
  )}?alt=media&supportsAllDrives=true`;
  const res = await googleFetch(accessToken, url);
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(errText || `Drive download error HTTP ${res.status}`);
  }
  const ab = await res.arrayBuffer();
  return { ...meta, bytes: Buffer.from(ab) };
}

export async function uploadFile(
  accessToken: string,
  input: {
    name: string;
    mimeType: string;
    bytes: Buffer;
    parents?: string[];
  },
): Promise<DriveFileMeta> {
  const metadata: Record<string, unknown> = {
    name: input.name,
    mimeType: input.mimeType || "application/pdf",
  };
  if (input.parents?.length) metadata.parents = input.parents;

  const boundary = `hr_boundary_${Date.now()}`;
  const metaPart = JSON.stringify(metadata);
  const preamble = Buffer.from(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metaPart}\r\n` +
      `--${boundary}\r\nContent-Type: ${input.mimeType || "application/pdf"}\r\nContent-Transfer-Encoding: binary\r\n\r\n`,
  );
  const closing = Buffer.from(`\r\n--${boundary}--`);
  const body = Buffer.concat([preamble, input.bytes, closing]);

  const url =
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,size&supportsAllDrives=true";
  const res = await googleFetch(accessToken, url, {
    method: "POST",
    headers: {
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  const json = (await res.json().catch(() => ({}))) as DriveFileMeta & {
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(json.error?.message || `Drive upload error HTTP ${res.status}`);
  }
  return {
    id: json.id,
    name: json.name,
    mimeType: json.mimeType,
    webViewLink: json.webViewLink,
    size: json.size,
  };
}
