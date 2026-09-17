"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { ReactFlowProvider, type Node, type Edge } from "@xyflow/react";
import FlowCanvas from "@/components/workflow/flow-canvas";
import {
  getWorkflow,
  saveWorkflow,
  nodeLabel,
  type WorkflowDocument,
  type WorkflowNode,
  type WorkflowEdge,
  type NodeType,
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
    const data = n.data as HRNodeData;
    return {
      id: n.id,
      type: data.nodeType,
      position: { x: n.position.x, y: n.position.y },
      config: data.config || {},
      status: data.status || "needs_config",
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

  const [doc, setDoc] = useState<WorkflowDocument | null>(null);
  const [saveStatus, setSaveStatus] = useState("Saved");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (!id) return;
    const existing = getWorkflow(id);
    if (!existing) {
      router.replace("/dashboard");
      return;
    }
    setDoc(existing);
    setSaveStatus("Saved");
  }, [id, router]);

  const initialNodes = useMemo(
    () => (doc ? toFlowNodes(doc.nodes) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [doc?.id]
  );

  const initialEdges = useMemo(
    () => (doc ? toFlowEdges(doc.edges) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [doc?.id]
  );

  const handleSave = useCallback(
    (currentNodes: Node[], currentEdges: Edge[]) => {
      if (!doc) return;
      const next: WorkflowDocument = {
        ...doc,
        nodes: fromFlowNodes(currentNodes),
        edges: fromFlowEdges(currentEdges),
        updatedAt: new Date().toISOString(),
      };
      saveWorkflow(next);
      setDoc(next);
      setSaveStatus("Saved");
    },
    [doc]
  );

  const handleRenameWorkflow = useCallback(
    (newName: string) => {
      if (!doc) return;
      const next: WorkflowDocument = {
        ...doc,
        name: newName,
        updatedAt: new Date().toISOString(),
      };
      saveWorkflow(next);
      setDoc(next);
    },
    [doc]
  );

  if (status === "loading" || !doc) {
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
          key={doc.id}
          initialNodes={initialNodes}
          initialEdges={initialEdges}
          title={doc.name}
          saveStatus={saveStatus}
          onDirty={() => setSaveStatus("Unsaved")}
          onSave={handleSave}
          onRenameWorkflow={handleRenameWorkflow}
        />
      </ReactFlowProvider>
    </div>
  );
}
