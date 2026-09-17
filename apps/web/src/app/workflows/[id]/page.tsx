"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { ReactFlowProvider, type Node, type Edge } from "@xyflow/react";
import FlowCanvas from "@/components/workflow/flow-canvas";
import FloatingToolbar from "@/components/workflow/floating-toolbar";
import FloatingNodePalette from "@/components/workflow/floating-node-palette";
import FloatingChatPanel from "@/components/workflow/floating-chat-panel";
import FloatingPropertiesPanel from "@/components/workflow/floating-properties-panel";
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
      label: nodeLabel(n.type),
      nodeType: n.type,
    } satisfies HRNodeData,
  }));
}

/** Convert our WorkflowEdges to React Flow Edges */
function toFlowEdges(wfEdges: WorkflowEdge[]): Edge[] {
  return wfEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    style: { stroke: "#94a3b8", strokeWidth: 2 },
    type: "smoothstep",
  }));
}

/** Convert React Flow Nodes back to our WorkflowNodes */
function fromFlowNodes(flowNodes: Node[]): WorkflowNode[] {
  return flowNodes.map((n) => ({
    id: n.id,
    type: (n.data as HRNodeData).nodeType as NodeType,
    position: { x: n.position.x, y: n.position.y },
    config: {},
  }));
}

/** Convert React Flow Edges back to our WorkflowEdges */
function fromFlowEdges(flowEdges: Edge[]): WorkflowEdge[] {
  return flowEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
  }));
}

export default function WorkflowBuilderPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { status } = useSession();

  const [doc, setDoc] = useState<WorkflowDocument | null>(null);
  const [saveStatus, setSaveStatus] = useState("Saved");
  const [runMessage, setRunMessage] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Track latest flow state for save
  const [currentNodes, setCurrentNodes] = useState<Node[]>([]);
  const [currentEdges, setCurrentEdges] = useState<Edge[]>([]);

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
    setCurrentNodes(toFlowNodes(existing.nodes));
    setCurrentEdges(toFlowEdges(existing.edges));
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

  const handleNodesChange = useCallback(
    (nodes: Node[]) => {
      setCurrentNodes(nodes);
      setSaveStatus("Unsaved");
    },
    []
  );

  const handleEdgesChange = useCallback(
    (edges: Edge[]) => {
      setCurrentEdges(edges);
      setSaveStatus("Unsaved");
    },
    []
  );

  const handleNodeSelect = useCallback((node: Node | null) => {
    setSelectedNode(node);
  }, []);

  const handleSave = useCallback(() => {
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
  }, [doc, currentNodes, currentEdges]);

  const handleRun = useCallback(() => {
    setRunMessage("UI only — Run Now will enqueue jobs when the backend is wired.");
    window.setTimeout(() => setRunMessage(null), 4000);
  }, []);

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
          initialNodes={initialNodes}
          initialEdges={initialEdges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onNodeSelect={handleNodeSelect}
        >
          {/* Floating toolbar */}
          <FloatingToolbar
            title={doc.name}
            paletteOpen={paletteOpen}
            chatOpen={chatOpen}
            onTogglePalette={() => setPaletteOpen((p) => !p)}
            onToggleChat={() => setChatOpen((p) => !p)}
            onSave={handleSave}
            onRun={handleRun}
            saveStatus={saveStatus}
          />

          {/* Run now banner */}
          {runMessage && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 rounded-xl border border-[rgba(20,184,166,0.2)] bg-[#f0fdfa] px-4 py-2 text-center text-sm text-[#0d9488] shadow-sm animate-in fade-in duration-200">
              {runMessage}
            </div>
          )}

          {/* Floating panels */}
          <FloatingNodePalette open={paletteOpen} />
          <FloatingChatPanel
            open={chatOpen}
            onClose={() => setChatOpen(false)}
            onOpen={() => setChatOpen(true)}
          />
          <FloatingPropertiesPanel
            selectedNode={selectedNode}
            onClose={() => setSelectedNode(null)}
          />
        </FlowCanvas>
      </ReactFlowProvider>
    </div>
  );
}
