import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@hr-automation/db";
import { getSessionUser } from "@/lib/server-auth";
import {
  formatDbWorkflowToReactFlow,
  prepareNodesAndEdgesForDb,
} from "@/lib/server-workflows";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/workflows/[id]
 * Fetches a single workflow by ID with its nodes and edges in React Flow format.
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const workflow = await prisma.workflow.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        currentVersion: {
          include: {
            nodes: true,
            edges: true,
          },
        },
      },
    });

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    return NextResponse.json({
      workflow: formatDbWorkflowToReactFlow(workflow),
    });
  } catch (err: any) {
    console.error("[GET /api/workflows/[id]] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch workflow" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/workflows/[id]
 * Updates workflow name, description, status, nodes, and edges.
 */
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));

    const existing = await prisma.workflow.findFirst({
      where: { id, userId: user.id },
      include: { currentVersion: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Ensure a valid WorkflowVersion exists
      let versionId = existing.currentVersionId;
      if (!versionId) {
        const newVersion = await tx.workflowVersion.create({
          data: {
            workflowId: id,
            versionNumber: 1,
            status: "PUBLISHED",
            createdById: user.id,
            publishedAt: new Date(),
          },
        });
        versionId = newVersion.id;
      }

      // If nodes or edges are provided, atomically replace existing ones
      if (Array.isArray(body.nodes) || Array.isArray(body.edges)) {
        // 1. Delete old edges first (foreign key dependency on nodes)
        await tx.workflowEdge.deleteMany({
          where: { workflowVersionId: versionId },
        });

        // 2. Delete old nodes
        await tx.workflowNode.deleteMany({
          where: { workflowVersionId: versionId },
        });

        // 3. Prepare normalized records
        const { nodesToCreate, edgesToCreate } = prepareNodesAndEdgesForDb(
          versionId,
          body.nodes || [],
          body.edges || []
        );

        // 4. Insert new nodes
        if (nodesToCreate.length > 0) {
          await tx.workflowNode.createMany({
            data: nodesToCreate,
          });
        }

        // 5. Insert new edges
        if (edgesToCreate.length > 0) {
          await tx.workflowEdge.createMany({
            data: edgesToCreate,
          });
        }
      }

      // Update workflow top-level metadata
      const updatedWf = await tx.workflow.update({
        where: { id },
        data: {
          ...(body.name ? { name: String(body.name).trim() } : {}),
          ...(body.description !== undefined
            ? { description: body.description ? String(body.description).trim() : null }
            : {}),
          ...(body.status ? { status: body.status } : {}),
          currentVersionId: versionId,
          updatedAt: new Date(),
        },
        include: {
          currentVersion: {
            include: {
              nodes: true,
              edges: true,
            },
          },
        },
      });

      return updatedWf;
    });

    return NextResponse.json({
      workflow: formatDbWorkflowToReactFlow(updated),
    });
  } catch (err: any) {
    console.error("[PUT /api/workflows/[id]] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update workflow" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workflows/[id]
 * Deletes the workflow and cascades versions, nodes, and edges.
 */
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const existing = await prisma.workflow.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    // Unset currentVersionId first to prevent circular cascade restriction
    await prisma.workflow.update({
      where: { id },
      data: { currentVersionId: null },
    });

    // Delete workflow (cascades to versions, nodes, edges)
    await prisma.workflow.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error("[DELETE /api/workflows/[id]] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete workflow" },
      { status: 500 }
    );
  }
}
