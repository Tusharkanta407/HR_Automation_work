import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma, type Prisma } from "@hr-automation/db";

type Ctx = { params: Promise<{ workflowId: string }> };

const MAX_BODY_BYTES = 1_000_000; // 1 MB

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

async function getWebhookNode(workflowId: string) {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    include: {
      currentVersion: {
        include: { nodes: true },
      },
      versions: {
        orderBy: { versionNumber: "desc" },
        take: 1,
        include: { nodes: true },
      },
    },
  });

  if (!workflow) return null;

  const version = workflow.currentVersion ?? workflow.versions[0];
  if (!version) return null;

  const node = version.nodes.find((n) => n.type === "WEBHOOK");
  return node ? { workflow, version, node } : null;
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { workflowId } = await params;
  const found = await getWebhookNode(workflowId);

  if (!found) {
    return NextResponse.json(
      { success: false, error: "Workflow or active Webhook trigger node not found" },
      { status: 404 }
    );
  }

  // Optional secret: header preferred, query param as fallback
  const config = (found.node.config as Record<string, unknown>) || {};
  const expected = typeof config.secret === "string" ? config.secret.trim() : undefined;

  if (expected) {
    const provided =
      req.headers.get("x-webhook-secret") ??
      req.nextUrl.searchParams.get("secret") ??
      "";
    if (!safeEqual(provided, expected)) {
      return NextResponse.json(
        { success: false, error: "Invalid secret" },
        { status: 401 }
      );
    }
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json(
      { success: false, error: "Payload too large (max 1MB)" },
      { status: 413 }
    );
  }

  let payload: unknown = raw;
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    // Keep as raw text
  }

  const execution = await prisma.execution.create({
    data: {
      workflowId,
      workflowVersionId: found.version.id,
      status: "QUEUED",
      triggerType: "WEBHOOK",
      input: {
        body: payload as Prisma.InputJsonValue,
        headers: Object.fromEntries(req.headers.entries()),
        query: Object.fromEntries(req.nextUrl.searchParams.entries()),
      } as Prisma.InputJsonObject,
    },
  });

  console.log(`[webhook] workflow=${workflowId} execution=${execution.id}`);

  return NextResponse.json({ success: true, executionId: execution.id }, { status: 202 });
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const { workflowId } = await params;
  const found = await getWebhookNode(workflowId);

  if (!found) {
    return NextResponse.json({ ok: false, error: "Webhook not found" }, { status: 404 });
  }

  const base = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;
  const config = (found.node.config as Record<string, unknown>) || {};
  const hasSecret = Boolean(config.secret);

  return NextResponse.json({
    ok: true,
    workflow: found.workflow.name,
    url: `${base}/api/webhooks/${workflowId}`,
    method: "POST",
    secretRequired: hasSecret,
    usage: `curl -X POST "${base}/api/webhooks/${workflowId}" -H "Content-Type: application/json"${
      hasSecret ? ' -H "x-webhook-secret: YOUR_SECRET"' : ""
    } -d '{"hello":"world"}'`,
  });
}