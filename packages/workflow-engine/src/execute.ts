import {
  prisma,
  type PrismaClient,
  touchExecutionHeartbeat,
} from "@hr-automation/db";
import {
  getValidAccessToken,
  getSheetValues,
  buildSheetPreview,
  parseSpreadsheetId,
  downloadFile,
  parseDriveFileId,
  sendOrDraftEmail,
} from "@hr-automation/google-workspace";
import { createContext, interpolate, type WorkflowContext } from "./context";

type DbNode = {
  id: string;
  type: string;
  name: string;
  integrationId: string | null;
  config: unknown;
};

type DbEdge = {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandle: string | null;
};

const SUPPORTED = new Set([
  "MANUAL_TRIGGER",
  "SCHEDULE",
  "WEBHOOK",
  "ASSESSMENT_COMPLETED",
  "CANDIDATE_HIRED",
  "READ_GOOGLE_SHEET",
  "FOR_EACH",
  "SEND_EMAIL",
  "SUCCESS",
  "LOG_RESULT",
  "DELAY",
]);

function cfg(node: DbNode): Record<string, any> {
  return (node.config && typeof node.config === "object"
    ? node.config
    : {}) as Record<string, any>;
}

function nextNodes(nodeId: string, edges: DbEdge[]): string[] {
  return edges.filter((e) => e.sourceNodeId === nodeId).map((e) => e.targetNodeId);
}

function findRoots(nodes: DbNode[], edges: DbEdge[]): DbNode[] {
  const targets = new Set(edges.map((e) => e.targetNodeId));
  const roots = nodes.filter((n) => !targets.has(n.id));
  if (roots.length) return roots;
  return nodes.filter((n) =>
    ["MANUAL_TRIGGER", "SCHEDULE", "WEBHOOK", "ASSESSMENT_COMPLETED", "CANDIDATE_HIRED"].includes(
      n.type,
    ),
  );
}

async function startNodeExec(
  db: PrismaClient,
  executionId: string,
  nodeId: string,
  input: unknown,
) {
  return db.nodeExecution.create({
    data: {
      executionId,
      nodeId,
      status: "RUNNING",
      input: input as any,
      startedAt: new Date(),
    },
  });
}

async function finishNodeExec(
  db: PrismaClient,
  nodeExecId: string,
  status: "SUCCESS" | "FAILED" | "SKIPPED",
  output?: unknown,
  error?: string,
) {
  const finishedAt = new Date();
  const existing = await db.nodeExecution.findUnique({ where: { id: nodeExecId } });
  const durationMs = existing?.startedAt
    ? finishedAt.getTime() - existing.startedAt.getTime()
    : null;
  await db.nodeExecution.update({
    where: { id: nodeExecId },
    data: {
      status,
      output: output as any,
      error: error || null,
      finishedAt,
      durationMs,
    },
  });
}

async function executeReadSheet(
  node: DbNode,
  ctx: WorkflowContext,
  db: PrismaClient = prisma,
): Promise<Record<string, unknown>> {
  if (!node.integrationId) throw new Error("READ_GOOGLE_SHEET requires a Google connection");
  const c = cfg(node);
  const spreadsheetId = parseSpreadsheetId(c.spreadsheetId || c.spreadsheetUrl);
  if (!spreadsheetId) throw new Error("spreadsheetId is required");
  const sheetName = String(c.sheetName || "Sheet1");
  const range = String(c.range || `${sheetName}!A:Z`);
  const { accessToken } = await getValidAccessToken(node.integrationId, db);
  const values = await getSheetValues(accessToken, spreadsheetId, range);
  const preview = buildSheetPreview({
    values,
    emailColumn: String(c.emailColumn || "email"),
    nameColumn: c.nameColumn ? String(c.nameColumn) : "name",
    driveFileColumn: c.driveFileColumn ? String(c.driveFileColumn) : null,
    maxRows: Math.min(Number(c.maxRows || 500), 500),
  });
  const rows = preview.rows.map((r) => ({
    ...r.cells,
    email: r.email,
    name: r.name,
    driveFileId: r.driveFileId,
    driveFileRaw: r.driveFileRaw,
    rowIndex: r.rowIndex,
  }));
  ctx.sheet_rows = rows;
  return { rowCount: rows.length, spreadsheetId, range };
}

async function executeSendEmail(
  node: DbNode,
  ctx: WorkflowContext,
  strict: boolean,
  db: PrismaClient = prisma,
): Promise<Record<string, unknown>> {
  const c = cfg(node);
  const to = interpolate(String(c.recipient || c.to || ""), ctx).trim();
  if (!to.includes("@")) {
    throw new Error(`Invalid recipient after interpolate: "${to}"`);
  }
  const subject = interpolate(
    String(c.subject || "Document from HR"),
    ctx,
  );
  const message = interpolate(
    String(c.message || c.body || ""),
    ctx,
  );
  const deliveryMode = String(c.deliveryMode || "draft");
  const attachmentMode = String(c.attachmentMode || "shared");

  if (!node.integrationId) {
    throw new Error("SEND_EMAIL requires a Google Workspace (or SMTP) connection");
  }

  // Minimal slice: Google Gmail only (SMTP not implemented in worker yet)
  const integration = await db.integration.findUnique({
    where: { id: node.integrationId },
  });
  if (!integration || (integration.type !== "OAUTH" && integration.provider !== "GOOGLE")) {
    throw new Error(
      "Worker SEND_EMAIL currently supports Google Workspace OAuth only — connect Google or use drafts via Google",
    );
  }

  const { accessToken } = await getValidAccessToken(node.integrationId, db);
  const attachments: Array<{ filename: string; mimeType: string; bytes: Buffer }> = [];

  if (attachmentMode === "shared") {
    const fileId = parseDriveFileId(c.sharedDriveFileId);
    if (fileId) {
      const file = await downloadFile(accessToken, fileId);
      attachments.push({
        filename: file.name,
        mimeType: file.mimeType || "application/pdf",
        bytes: file.bytes,
      });
    } else if (strict) {
      throw new Error("sharedDriveFileId required in shared attachment mode");
    }
  } else if (attachmentMode === "per_row") {
    const fromItem =
      (ctx.item?.driveFileId as string | null | undefined) ||
      (ctx.item?.driveFileRaw as string | null | undefined) ||
      (c.driveFileColumn && ctx.item
        ? String((ctx.item as any)[c.driveFileColumn] || "")
        : "");
    const fileId = parseDriveFileId(fromItem);
    if (!fileId) {
      if (strict) throw new Error(`Missing Drive file for recipient ${to}`);
      return { skipped: true, reason: "missing_drive_file", to };
    }
    const file = await downloadFile(accessToken, fileId);
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
    bodyHtml: `<pre style="font-family:inherit;white-space:pre-wrap">${message
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")}</pre>`,
    attachments,
    asDraft: deliveryMode !== "send",
  });

  return { to, subject, attachmentCount: attachments.length, ...result };
}

/**
 * Execute a QUEUED/RUNNING workflow execution (sheet → foreach → gmail path).
 */
export async function runExecution(
  executionId: string,
  workerId: string,
  db: PrismaClient = prisma,
): Promise<{ status: "SUCCESS" | "FAILED"; summary: Record<string, unknown> }> {
  const execution = await db.execution.findUnique({
    where: { id: executionId },
    include: {
      workflowVersion: {
        include: { nodes: true, edges: true },
      },
    },
  });
  if (!execution) throw new Error("Execution not found");

  await touchExecutionHeartbeat(db, executionId, workerId).catch(() => undefined);

  const nodes = execution.workflowVersion.nodes as DbNode[];
  const edges = execution.workflowVersion.edges as DbEdge[];
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const ctx = createContext(execution.input);
  const summary: Record<string, unknown> = {
    emailsAttempted: 0,
    emailsOk: 0,
    emailsFailed: 0,
    emailsSkipped: 0,
  };

  try {
    const roots = findRoots(nodes, edges);
    if (!roots.length) throw new Error("Workflow has no start node");

    const queue: string[] = roots.map((r) => r.id);
    const visited = new Set<string>();

    while (queue.length) {
      const nodeId = queue.shift()!;
      if (visited.has(nodeId)) continue;
      const node = byId.get(nodeId);
      if (!node) continue;

      if (!SUPPORTED.has(node.type)) {
        const ne = await startNodeExec(db, executionId, node.id, { type: node.type });
        await finishNodeExec(
          db,
          ne.id,
          "FAILED",
          null,
          `Node type ${node.type} is not implemented in the worker yet`,
        );
        throw new Error(`Unsupported node type: ${node.type}`);
      }

      // FOR_EACH expands children per item
      if (node.type === "FOR_EACH") {
        visited.add(nodeId);
        const ne = await startNodeExec(db, executionId, node.id, cfg(node));
        const collectionKey = String(cfg(node).collection || "{{sheet_rows}}")
          .replace(/[{}]/g, "")
          .trim();
        const items =
          collectionKey === "sheet_rows" || collectionKey === "item"
            ? ctx.sheet_rows
            : ((ctx as any)[collectionKey] as unknown[]) || ctx.sheet_rows;

        const childIds = nextNodes(node.id, edges);
        let ok = 0;
        let fail = 0;
        let skip = 0;

        for (const item of items) {
          ctx.item = item as Record<string, unknown>;
          for (const childId of childIds) {
            const child = byId.get(childId);
            if (!child) continue;
            visited.add(childId);
            const childNe = await startNodeExec(db, executionId, child.id, {
              item,
            });
            try {
              if (child.type === "SEND_EMAIL") {
                summary.emailsAttempted = Number(summary.emailsAttempted) + 1;
                const out = await executeSendEmail(
                  child,
                  ctx,
                  Boolean(cfg(child).strict),
                  db,
                );
                if ((out as any).skipped) {
                  skip++;
                  summary.emailsSkipped = Number(summary.emailsSkipped) + 1;
                  await finishNodeExec(db, childNe.id, "SKIPPED", out);
                } else {
                  ok++;
                  summary.emailsOk = Number(summary.emailsOk) + 1;
                  await finishNodeExec(db, childNe.id, "SUCCESS", out);
                }
              } else if (child.type === "SUCCESS" || child.type === "LOG_RESULT") {
                await finishNodeExec(db, childNe.id, "SUCCESS", { item });
              } else if (child.type === "DELAY") {
                await finishNodeExec(db, childNe.id, "SUCCESS", { delayed: true });
              } else {
                await finishNodeExec(
                  db,
                  childNe.id,
                  "FAILED",
                  null,
                  `Unsupported inside FOR_EACH: ${child.type}`,
                );
                fail++;
              }
            } catch (err: any) {
              fail++;
              summary.emailsFailed = Number(summary.emailsFailed) + 1;
              await finishNodeExec(db, childNe.id, "FAILED", null, err.message);
              if (cfg(child).strict) throw err;
            }
          }
        }

        ctx.item = null;
        await finishNodeExec(db, ne.id, "SUCCESS", {
          iterated: items.length,
          ok,
          fail,
          skip,
        });

        // Continue after for-each subgraph: grandchildren already visited; follow edges from for-each only if not children
        continue;
      }

      visited.add(nodeId);
      const ne = await startNodeExec(db, executionId, node.id, cfg(node));

      try {
        let output: Record<string, unknown> = {};
        if (
          node.type === "MANUAL_TRIGGER" ||
          node.type === "SCHEDULE" ||
          node.type === "WEBHOOK" ||
          node.type === "ASSESSMENT_COMPLETED" ||
          node.type === "CANDIDATE_HIRED"
        ) {
          output = { triggered: true };
        } else if (node.type === "READ_GOOGLE_SHEET") {
          output = await executeReadSheet(node, ctx, db);
        } else if (node.type === "SEND_EMAIL") {
          summary.emailsAttempted = Number(summary.emailsAttempted) + 1;
          output = await executeSendEmail(
            node,
            ctx,
            Boolean(cfg(node).strict),
            db,
          );
          if ((output as any).skipped) {
            summary.emailsSkipped = Number(summary.emailsSkipped) + 1;
          } else {
            summary.emailsOk = Number(summary.emailsOk) + 1;
          }
        } else if (node.type === "SUCCESS" || node.type === "LOG_RESULT") {
          output = { ok: true };
        } else if (node.type === "DELAY") {
          output = { delayed: true };
        }

        await finishNodeExec(db, ne.id, "SUCCESS", output);
        for (const next of nextNodes(node.id, edges)) {
          if (!visited.has(next)) queue.push(next);
        }
      } catch (err: any) {
        await finishNodeExec(db, ne.id, "FAILED", null, err.message);
        throw err;
      }
    }

    await db.execution.update({
      where: { id: executionId },
      data: {
        status: "SUCCESS",
        output: summary as any,
        finishedAt: new Date(),
        error: null,
      },
    });
    return { status: "SUCCESS", summary };
  } catch (err: any) {
    await db.execution.update({
      where: { id: executionId },
      data: {
        status: "FAILED",
        output: summary as any,
        error: err.message || "Execution failed",
        finishedAt: new Date(),
      },
    });
    return { status: "FAILED", summary: { ...summary, error: err.message } };
  }
}
