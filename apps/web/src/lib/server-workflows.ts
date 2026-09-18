import type { Node, Edge } from "@xyflow/react";
import type { HRNodeData } from "@/components/workflow/custom-node";

type DbNode = {
  id: string;
  type: string;
  name: string;
  config: any;
  positionX: number;
  positionY: number;
};

type DbEdge = {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandle: string | null;
  targetHandle: string | null;
};

export type FormattedWorkflowResponse = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  updatedAt: string;
  versionNumber: number;
  nodes: Node[];
  edges: Edge[];
};

/**
 * Transforms relational database Workflow + Version + Nodes + Edges
 * into React Flow canvas nodes and edges.
 */
export function formatDbWorkflowToReactFlow(workflow: {
  id: string;
  name: string;
  description: string | null;
  status: string;
  updatedAt: Date;
  currentVersion?: {
    versionNumber: number;
    nodes: DbNode[];
    edges: DbEdge[];
  } | null;
}): FormattedWorkflowResponse {
  const version = workflow.currentVersion;
  const dbNodes = version?.nodes || [];
  const dbEdges = version?.edges || [];

  const nodes: Node[] = dbNodes.map((n) => {
    const isSticky = n.type === "stickyNote";
    const cfg = (n.config || {}) as Record<string, any>;

    return {
      id: n.id,
      type: isSticky ? "stickyNote" : "hrNode",
      position: { x: n.positionX, y: n.positionY },
      data: isSticky
        ? {
            title: cfg.title || n.name || "I'm a note",
            content: cfg.content || "",
            color: cfg.color || "yellow",
          }
        : ({
            label: n.name,
            nodeType: n.type as any,
            status: cfg.status || "configured",
            config: cfg,
            subtitle: cfg.subtitle,
          } satisfies HRNodeData),
    };
  });

  const edges: Edge[] = dbEdges.map((e) => {
    const isTrue = e.sourceHandle === "true";
    const isFalse = e.sourceHandle === "false";

    return {
      id: e.id,
      source: e.sourceNodeId,
      target: e.targetNodeId,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      label: isTrue ? "TRUE" : isFalse ? "FALSE" : undefined,
      labelStyle: isTrue
        ? { fill: "#059669", fontWeight: 700, fontSize: 10 }
        : isFalse
        ? { fill: "#e11d48", fontWeight: 700, fontSize: 10 }
        : undefined,
      labelBgStyle: { fill: "#ffffff", fillOpacity: 0.9, rx: 4, ry: 4 },
      style: {
        stroke: isTrue ? "#10b981" : isFalse ? "#f43f5e" : "#94a3b8",
        strokeWidth: 2,
      },
      type: "smoothstep",
    };
  });

  return {
    id: workflow.id,
    name: workflow.name,
    description: workflow.description,
    status: workflow.status,
    updatedAt: workflow.updatedAt.toISOString(),
    versionNumber: version?.versionNumber || 1,
    nodes,
    edges,
  };
}

/**
 * Normalizes incoming React Flow / workflow nodes and edges into
 * clean records ready for Prisma DB insertion.
 */
export function prepareNodesAndEdgesForDb(
  versionId: string,
  rawNodes: any[] = [],
  rawEdges: any[] = []
) {
  const nodesToCreate = rawNodes.map((n) => {
    const isSticky = n.type === "stickyNote";
    const data = n.data || {};
    const config = isSticky
      ? {
          title: data.title || "Note",
          content: data.content || "",
          color: data.color || "yellow",
        }
      : (data.config || n.config || {});

    const type = isSticky
      ? "stickyNote"
      : (data.nodeType || n.type || "CUSTOM_API");

    const name = isSticky
      ? (data.title || "Note")
      : (data.label || n.name || type);

    const nodeId = String(n.id || crypto.randomUUID());

    return {
      id: nodeId,
      workflowVersionId: versionId,
      type: String(type),
      name: String(name),
      positionX: typeof n.position?.x === "number" ? n.position.x : 0,
      positionY: typeof n.position?.y === "number" ? n.position.y : 0,
      config: config as any,
    };
  });

  const validNodeIds = new Set(nodesToCreate.map((n) => n.id));

  const edgesToCreate = rawEdges
    .filter((e) => {
      const source = e.source || e.sourceNodeId;
      const target = e.target || e.targetNodeId;
      return validNodeIds.has(source) && validNodeIds.has(target);
    })
    .map((e) => ({
      id: String(e.id || crypto.randomUUID()),
      workflowVersionId: versionId,
      sourceNodeId: String(e.source || e.sourceNodeId),
      targetNodeId: String(e.target || e.targetNodeId),
      sourceHandle: e.sourceHandle ? String(e.sourceHandle) : null,
      targetHandle: e.targetHandle ? String(e.targetHandle) : null,
    }));

  return { nodesToCreate, edgesToCreate };
}

