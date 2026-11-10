import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@hr-automation/db";
import { getSessionUser } from "@/lib/server-auth";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/executions/[id]
 * Poll execution status + node logs for the Run Now drawer.
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const execution = await prisma.execution.findFirst({
      where: {
        id,
        workflow: { userId: user.id },
      },
      include: {
        nodeExecutions: {
          orderBy: { startedAt: "asc" },
          include: {
            node: { select: { id: true, name: true, type: true } },
          },
        },
      },
    });

    if (!execution) {
      return NextResponse.json({ error: "Execution not found" }, { status: 404 });
    }

    return NextResponse.json({
      execution: {
        id: execution.id,
        status: execution.status,
        error: execution.error,
        output: execution.output,
        startedAt: execution.startedAt,
        finishedAt: execution.finishedAt,
        createdAt: execution.createdAt,
        nodeExecutions: execution.nodeExecutions.map((ne) => ({
          id: ne.id,
          status: ne.status,
          error: ne.error,
          output: ne.output,
          durationMs: ne.durationMs,
          startedAt: ne.startedAt,
          finishedAt: ne.finishedAt,
          node: ne.node,
        })),
      },
    });
  } catch (err: any) {
    console.error("[GET /api/executions/[id]]", err);
    return NextResponse.json(
      { error: err.message || "Failed to load execution" },
      { status: 500 },
    );
  }
}
