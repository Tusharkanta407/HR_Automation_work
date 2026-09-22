"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { ReactFlowProvider, type Node, type Edge } from "@xyflow/react";
import FlowCanvas from "@/components/workflow/flow-canvas";
import {
  getWorkflow,
  saveWorkflow,
  nodeLabel,
  fetchWorkflowApi,
  saveWorkflowApi,
  type WorkflowDocument,
  type WorkflowNode,
  type WorkflowEdge,
} from "@/lib/workflow";
import type { HRNodeData } from "@/components/workflow/custom-node";

/** Convert our WorkflowNodes to React Flow Nodes */
function toFlowNodes(wfNodes: WorkflowNode[]): Node[] {
  return wfNodes.map((n) => ({
    id: n.id,
    type: "hrNode",
    position: n.position,
    data: {
      label: (n.config?.customLabel as string) || nodeLabel(n.type),
      nodeType: n.type,
      status: n.status || (Object.keys(n.config || {}).length > 0 ? "configured" : "needs_config"),
      config: n.config || {},
      subtitle: (n.config?.summary as string) || "",
      integrationId: n.integrationId ?? null,
    } satisfies HRNodeData,
  }));
}

/** Convert our WorkflowEdges to React Flow Edges */
function toFlowEdges(wfEdges: WorkflowEdge[]): Edge[] {
  return wfEdges.map((e) => {
    const isTrue = e.sourceHandle === "true";
    const isFalse = e.sourceHandle === "false";
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      label: isTrue ? "TRUE" : isFalse ? "FALSE" : e.label,
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
}

/** Convert React Flow Nodes back to our WorkflowNodes */
function fromFlowNodes(flowNodes: Node[]): WorkflowNode[] {
  return flowNodes.map((n) => {
    if (n.type === "stickyNote") {
      const data = (n.data || {}) as Record<string, any>;
      return {
        id: n.id,
        type: "CUSTOM_API" as any,
        position: { x: n.position.x, y: n.position.y },
        config: {
          title: data.title || "Note",
          content: data.content || "",
          color: data.color || "yellow",
        },
        status: "configured",
      };
    }
    const data = (n.data || {}) as HRNodeData;
    return {
      id: n.id,
      type: data.nodeType || ("CUSTOM_API" as any),
      position: { x: n.position.x, y: n.position.y },
      config: data.config || {},
      status: data.status || "needs_config",
      integrationId: data.integrationId ?? null,
    };
  });
}

/** Convert React Flow Edges back to our WorkflowEdges */
function fromFlowEdges(flowEdges: Edge[]): WorkflowEdge[] {
  return flowEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle ?? null,
    targetHandle: e.targetHandle ?? null,
    label: (e.label as string) || undefined,
  }));
}

export default function WorkflowBuilderPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { status } = useSession();

  const [workflowName, setWorkflowName] = useState<string>("Untitled workflow");
  const [initialNodes, setInitialNodes] = useState<Node[]>([]);
  const [initialEdges, setInitialEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState("Saved");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    async function loadWorkflow() {
      setLoading(true);

      // Try database API first
      const apiWf = await fetchWorkflowApi(id);
      if (!isMounted) return;

      if (apiWf) {
        setWorkflowName(apiWf.name);
        setInitialNodes(apiWf.nodes || []);
        setInitialEdges(apiWf.edges || []);
        setSaveStatus("Saved");
        setLoading(false);
        return;
      }

      // Check localStorage fallback
      const existing = getWorkflow(id);
      if (existing) {
        setWorkflowName(existing.name);
        setInitialNodes(toFlowNodes(existing.nodes));
        setInitialEdges(toFlowEdges(existing.edges));
        setSaveStatus("Saved");
        setLoading(false);
        return;
      }

      router.replace("/dashboard");
    }

    loadWorkflow();

    return () => {
      isMounted = false;
    };
  }, [id, router]);

  const handleSave = useCallback(
    async (currentNodes: Node[], currentEdges: Edge[]) => {
      setSaveStatus("Saving...");

      // 1. Save to Database via API
      const ok = await saveWorkflowApi(id, {
        name: workflowName,
        nodes: currentNodes,
        edges: currentEdges,
      });

      // 2. Keep localStorage synced as fallback
      const nextDoc: WorkflowDocument = {
        id,
        name: workflowName,
        nodes: fromFlowNodes(currentNodes),
        edges: fromFlowEdges(currentEdges),
        updatedAt: new Date().toISOString(),
      };
      saveWorkflow(nextDoc);

      setSaveStatus(ok ? "Saved" : "Save error");
    },
    [id, workflowName]
  );

  const handleRenameWorkflow = useCallback(
    async (newName: string) => {
      setWorkflowName(newName);
      await saveWorkflowApi(id, { name: newName });
      const local = getWorkflow(id);
      if (local) {
        saveWorkflow({
          ...local,
          name: newName,
          updatedAt: new Date().toISOString(),
        });
      }
    },
    [id]
  );

  const handleDirty = useCallback(() => {
    setSaveStatus((prev) => (prev === "Unsaved" ? prev : "Unsaved"));
  }, []);

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8f3]">
        <Loader2 className="h-8 w-8 animate-spin text-[#14b8a6]" />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#faf8f3]">
      <ReactFlowProvider>
        <FlowCanvas
          key={id}
          initialNodes={initialNodes}
          initialEdges={initialEdges}
          title={workflowName}
          saveStatus={saveStatus}
          onDirty={handleDirty}
          onSave={handleSave}
          onRenameWorkflow={handleRenameWorkflow}
        />
      </ReactFlowProvider>
    </div>
  );
}

