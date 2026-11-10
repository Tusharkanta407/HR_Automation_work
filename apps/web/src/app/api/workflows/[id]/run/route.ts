import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@hr-automation/db";
import { getSessionUser } from "@/lib/server-auth";
import { enqueueExecution } from "@/lib/enqueue-execution";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/workflows/[id]/run
 * Create Execution (QUEUED) and enqueue for the worker.
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workflowId } = await params;
    const body = await req.json().catch(() => ({}));

    const workflow = await prisma.workflow.findFirst({
      where: { id: workflowId, userId: user.id },
      include: {
        currentVersion: {
          include: { nodes: true },
        },
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
        },
      },
    });

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    const version = workflow.currentVersion ?? workflow.versions[0];
    if (!version) {
      return NextResponse.json(
        { error: "Workflow has no version to run — save the workflow first" },
        { status: 400 },
      );
    }

    const idempotencyKey =
      typeof body.idempotencyKey === "string" && body.idempotencyKey
        ? body.idempotencyKey
        : null;

    if (idempotencyKey) {
      const existing = await prisma.execution.findUnique({
        where: { idempotencyKey },
      });
      if (existing) {
        return NextResponse.json({
          success: true,
          executionId: existing.id,
          status: existing.status,
          deduped: true,
        });
      }
    }

    const execution = await prisma.execution.create({
      data: {
        workflowId,
        workflowVersionId: version.id,
        status: "QUEUED",
        triggerType: "MANUAL",
        input: {
          source: "run_now",
          requestedBy: user.email,
          ...(body.input && typeof body.input === "object" ? body.input : {}),
        },
        idempotencyKey: idempotencyKey || undefined,
      },
    });

    const enqueue = await enqueueExecution({
      executionId: execution.id,
      workflowId,
      versionId: version.id,
    });

    if (!enqueue.enqueued) {
      // Keep QUEUED in Neon so ops can re-drive; surface Redis issue clearly
      console.error("[run] enqueue failed", enqueue.reason);
    }

    return NextResponse.json(
      {
        success: true,
        executionId: execution.id,
        status: "QUEUED",
        enqueue,
      },
      { status: 202 },
    );
  } catch (err: any) {
    console.error("[POST /api/workflows/[id]/run]", err);
    return NextResponse.json(
      { error: err.message || "Failed to start run" },
      { status: 500 },
    );
  }
}
