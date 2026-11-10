import { randomBytes } from "node:crypto";
import { googleFetch } from "./auth";
import type { GmailSendInput, GmailSendResult } from "./types";

function encodeSubject(subject: string): string {
  // RFC 2047 for non-ascii
  if (/^[\x20-\x7E]*$/.test(subject)) return subject;
  return `=?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`;
}

function buildRawMime(input: GmailSendInput): string {
  const boundary = `hr_${randomBytes(12).toString("hex")}`;
  const hasAttachments = Boolean(input.attachments?.length);
  const lines: string[] = [];

  lines.push(`To: ${input.to}`);
  lines.push(`Subject: ${encodeSubject(input.subject)}`);
  lines.push("MIME-Version: 1.0");

  const text = input.bodyText || input.bodyHtml?.replace(/<[^>]+>/g, " ") || "";
  const html = input.bodyHtml || `<pre>${escapeHtml(text)}</pre>`;

  if (hasAttachments) {
    lines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
    lines.push("");
    lines.push(`--${boundary}`);
    lines.push("Content-Type: text/html; charset=UTF-8");
    lines.push("Content-Transfer-Encoding: base64");
    lines.push("");
    lines.push(Buffer.from(html, "utf8").toString("base64"));

    for (const att of input.attachments || []) {
      lines.push(`--${boundary}`);
      lines.push(
        `Content-Type: ${att.mimeType || "application/pdf"}; name="${att.filename}"`,
      );
      lines.push("Content-Transfer-Encoding: base64");
      lines.push(
        `Content-Disposition: attachment; filename="${att.filename}"`,
      );
      lines.push("");
      lines.push(att.bytes.toString("base64"));
    }
    lines.push(`--${boundary}--`);
  } else {
    lines.push("Content-Type: text/html; charset=UTF-8");
    lines.push("Content-Transfer-Encoding: base64");
    lines.push("");
    lines.push(Buffer.from(html, "utf8").toString("base64"));
  }

  return Buffer.from(lines.join("\r\n"), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function sendOrDraftEmail(
  accessToken: string,
  input: GmailSendInput,
): Promise<GmailSendResult> {
  if (!input.to?.includes("@")) {
    throw new Error("Invalid recipient email");
  }
  const raw = buildRawMime(input);
  const asDraft = Boolean(input.asDraft);

  if (asDraft) {
    const res = await googleFetch(
      accessToken,
      "https://gmail.googleapis.com/gmail/v1/users/me/drafts",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: { raw } }),
      },
    );
    const json = (await res.json().catch(() => ({}))) as {
      id?: string;
      error?: { message?: string };
    };
    if (!res.ok) {
      throw new Error(json.error?.message || `Gmail draft error HTTP ${res.status}`);
    }
    return { id: json.id || "draft", mode: "draft" };
  }

  const res = await googleFetch(
    accessToken,
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raw }),
    },
  );
  const json = (await res.json().catch(() => ({}))) as {
    id?: string;
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(json.error?.message || `Gmail send error HTTP ${res.status}`);
  }
  return { id: json.id || "sent", mode: "send" };
}
