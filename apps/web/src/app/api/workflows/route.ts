import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@hr-automation/db";
import { getSessionUser } from "@/lib/server-auth";
import {
  formatDbWorkflowToReactFlow,
  prepareNodesAndEdgesForDb,
} from "@/lib/server-workflows";

/**
 * GET /api/workflows
 * Lists all workflows owned by the current user.
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workflows = await prisma.workflow.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        currentVersion: {
          select: {
            versionNumber: true,
            status: true,
            _count: {
              select: {
                nodes: true,
                edges: true,
              },
            },
          },
        },
      },
    });

    const formatted = workflows.map((w) => ({
      id: w.id,
      name: w.name,
      description: w.description,
      status: w.status,
      updatedAt: w.updatedAt.toISOString(),
      createdAt: w.createdAt.toISOString(),
      versionNumber: w.currentVersion?.versionNumber ?? 1,
      nodeCount: w.currentVersion?._count.nodes ?? 0,
      edgeCount: w.currentVersion?._count.edges ?? 0,
    }));

    return NextResponse.json({ workflows: formatted });
  } catch (err: any) {
    console.error("[GET /api/workflows] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch workflows" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workflows
 * Creates a new workflow along with version 1 and optional initial nodes/edges.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const name = (body.name || "Untitled workflow").trim();
    const description = body.description ? String(body.description).trim() : null;

    const created = await prisma.$transaction(async (tx) => {
      // 1. Create Workflow record
      const workflow = await tx.workflow.create({
        data: {
          name,
          description,
          status: "DRAFT",
          userId: user.id,
        },
      });

      // 2. Create published version 1
      const version = await tx.workflowVersion.create({
        data: {
          workflowId: workflow.id,
          versionNumber: 1,
          status: "PUBLISHED",
          createdById: user.id,
          publishedAt: new Date(),
        },
      });

      // 3. Prepare and insert initial nodes & edges if provided
      const { nodesToCreate, edgesToCreate } = prepareNodesAndEdgesForDb(
        version.id,
        body.nodes || [],
        body.edges || []
      );

      if (nodesToCreate.length > 0) {
        await tx.workflowNode.createMany({
          data: nodesToCreate,
        });
      }

      if (edgesToCreate.length > 0) {
        await tx.workflowEdge.createMany({
          data: edgesToCreate,
        });
      }

      // 4. Point workflow.currentVersionId to this version
      const completeWorkflow = await tx.workflow.update({
        where: { id: workflow.id },
        data: { currentVersionId: version.id },
        include: {
          currentVersion: {
            include: {
              nodes: true,
              edges: true,
            },
          },
        },
      });

      return completeWorkflow;
    });

    return NextResponse.json(
      { workflow: formatDbWorkflowToReactFlow(created) },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[POST /api/workflows] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create workflow" },
      { status: 500 }
    );
  }
}
