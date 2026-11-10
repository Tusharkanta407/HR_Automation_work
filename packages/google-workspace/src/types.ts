export type GoogleOAuthSecret = {
  refreshToken: string;
  accessToken: string;
  clientId: string;
  clientSecret: string;
  email?: string;
};

export type DriveFileMeta = {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  size?: string;
};

export type DriveFileBytes = DriveFileMeta & {
  bytes: Buffer;
};

export type GmailAttachment = {
  filename: string;
  mimeType: string;
  bytes: Buffer;
};

export type GmailSendInput = {
  to: string;
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  attachments?: GmailAttachment[];
  /** draft = create Gmail draft; send = deliver immediately */
  asDraft?: boolean;
};

export type GmailSendResult = {
  id: string;
  mode: "draft" | "send";
};

export type SheetPreviewRow = {
  rowIndex: number;
  email: string | null;
  name: string | null;
  driveFileRaw: string | null;
  driveFileId: string | null;
  cells: Record<string, string>;
};
