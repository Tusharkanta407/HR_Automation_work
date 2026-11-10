"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Connection,
  type Node,
  type Edge,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import HRCustomNode, { type HRNodeData } from "./custom-node";
import StickyNoteNode from "./sticky-note-node";
import { nodeLabel, type NodeType } from "@/lib/workflow";
import FloatingToolbar from "./floating-toolbar";
import FloatingNodePalette from "./floating-node-palette";
import FloatingChatPanel from "./floating-chat-panel";
import CanvasDock from "./canvas-dock";
import NodeConfigDialog from "./node-config-dialog";
import WorkflowSettingsDialog from "./workflow-settings-dialog";
import ExecutionLogDrawer, { type ExecutionLog } from "./execution-log-drawer";
import { Copy, Settings2, Trash2 } from "lucide-react";

const nodeTypes = { hrNode: HRCustomNode, stickyNote: StickyNoteNode };

type FlowCanvasProps = {
  workflowId?: string;
  initialNodes: Node[];
  initialEdges: Edge[];
  title: string;
  saveStatus: string;
  onSave: (currentNodes: Node[], currentEdges: Edge[]) => void | Promise<void>;
  onRenameWorkflow: (newName: string) => void;
  onDirty?: () => void;
};

export default function FlowCanvas({
  workflowId,
  initialNodes,
  initialEdges,
  title,
  saveStatus,
  onSave,
  onRenameWorkflow,
  onDirty,
}: FlowCanvasProps) {
  const [nodes, setNodes, handleNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, handleEdgesChange] = useEdgesState(initialEdges);
  const { screenToFlowPosition, fitView } = useReactFlow();

  // Panels & Dialogs state
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<string>("select");
  const [isLocked, setIsLocked] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    type: "node" | "edge";
    id: string;
    x: number;
    y: number;
  } | null>(null);

  // Execution logs simulation
  const [executionOpen, setExecutionOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);

  // History for Undo / Redo
  const [history, setHistory] = useState<Array<{ nodes: Node[]; edges: Edge[] }>>([
    { nodes: initialNodes, edges: initialEdges },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Dismiss context menu on any global left click
  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  // Save history snapshot on change
  const pushHistory = useCallback(
    (newNodes: Node[], newEdges: Edge[]) => {
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        return [...sliced, { nodes: newNodes, edges: newEdges }].slice(-25);
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 24));
      if (onDirty) {
        setTimeout(onDirty, 0);
      }
    },
    [historyIndex, onDirty]
  );

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setNodes(prev.nodes);
      setEdges(prev.edges);
      setHistoryIndex((i) => i - 1);
      if (onDirty) setTimeout(onDirty, 0);
    }
  }, [history, historyIndex, setNodes, setEdges, onDirty]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setNodes(next.nodes);
      setEdges(next.edges);
      setHistoryIndex((i) => i + 1);
      if (onDirty) setTimeout(onDirty, 0);
    }
  }, [history, historyIndex, setNodes, setEdges, onDirty]);

  // Connect handler supporting Branching Condition/IF (TRUE / FALSE)
  const onConnect = useCallback(
    (params: Connection) => {
      const isTrue = params.sourceHandle === "true";
      const isFalse = params.sourceHandle === "false";

      const nextEdges = addEdge(
        {
          ...params,
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
        },
        edges
      );
      setEdges(nextEdges);
      pushHistory(nodes, nextEdges);
    },
    [edges, nodes, setEdges, pushHistory]
  );

  // Clicking a node opens the focused blur dialog (ignore sticky notes)
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    if (node.type === "stickyNote") return; // Sticky notes are edited directly on canvas!
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setContextMenu(null);
  }, []);

  // Duplicate a node with offset
  const handleDuplicateNode = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;
      const id = crypto.randomUUID();
      const clonedNode: Node = {
        ...node,
        id,
        position: {
          x: node.position.x + 35,
          y: node.position.y + 35,
        },
        selected: true,
      };
      const nextNodes = [...nodes.map((n) => ({ ...n, selected: false })), clonedNode];
      setNodes(nextNodes);
      pushHistory(nextNodes, edges);
    },
    [nodes, edges, setNodes, pushHistory]
  );

  // Delete an edge connector
  const handleDeleteEdge = useCallback(
    (edgeId: string) => {
      const nextEdges = edges.filter((e) => e.id !== edgeId);
      setEdges(nextEdges);
      pushHistory(nodes, nextEdges);
    },
    [nodes, edges, setEdges, pushHistory]
  );

  // Right-click context menus for node and edge
  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      type: "node",
      id: node.id,
      x: event.clientX,
      y: event.clientY,
    });
  }, []);

  const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      type: "edge",
      id: edge.id,
      x: event.clientX,
      y: event.clientY,
    });
  }, []);

  // Keyboard shortcut: Delete / Backspace for selected node or edge
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

        // Check if a node is selected
        const selectedN = nodes.find((n) => n.selected);
        if (selectedN) {
          handleDeleteNode(selectedN.id);
          return;
        }

        // Check if an edge is selected
        const selectedE = edges.find((e) => e.selected);
        if (selectedE) {
          handleDeleteEdge(selectedE.id);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // Add Node to canvas (places at visible screen center)
  const handleAddNode = useCallback(
    (type: NodeType) => {
      const id = `node_${Date.now()}`;
      const centerX = typeof window !== "undefined" ? window.innerWidth / 2 : 400;
      const centerY = typeof window !== "undefined" ? window.innerHeight / 2 : 300;
      const flowPos = screenToFlowPosition({ x: centerX, y: centerY });
      const offset = (nodes.length % 5) * 20;

      const newNode: Node = {
        id,
        type: "hrNode",
        position: {
          x: flowPos.x - 110 + offset,
          y: flowPos.y - 40 + offset,
        },
        data: {
          label: nodeLabel(type),
          nodeType: type,
          status: "needs_config",
          config: {},
        } satisfies HRNodeData,
      };

      const nextNodes = [...nodes, newNode];
      setNodes(nextNodes);
      pushHistory(nextNodes, edges);
    },
    [nodes, edges, setNodes, pushHistory, screenToFlowPosition]
  );

  // Add Sticky Note to canvas (places at visible screen center)
  const handleAddStickyNote = useCallback(() => {
    const id = `note_${Date.now()}`;
    const centerX = typeof window !== "undefined" ? window.innerWidth / 2 : 400;
    const centerY = typeof window !== "undefined" ? window.innerHeight / 2 : 300;
    const flowPos = screenToFlowPosition({ x: centerX, y: centerY });
    const offset = (nodes.length % 5) * 20;

    const newNote: Node = {
      id,
      type: "stickyNote",
      position: {
        x: flowPos.x - 120 + offset,
        y: flowPos.y - 60 + offset,
      },
      data: {
        title: "I'm a note",
        content: "Double click to edit me. Add workflow documentation, guidelines, or tasks here.",
        color: "yellow",
      },
    };

    const nextNodes = [...nodes, newNote];
    setNodes(nextNodes);
    pushHistory(nextNodes, edges);
  }, [nodes, edges, setNodes, pushHistory, screenToFlowPosition]);

  // Drag & Drop from palette
  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow-type") as NodeType;
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: crypto.randomUUID(),
        type: "hrNode",
        position,
        data: {
          label: nodeLabel(type),
          nodeType: type,
          status: "needs_config",
          config: {},
        } satisfies HRNodeData,
      };

      const nextNodes = [...nodes, newNode];
      setNodes(nextNodes);
      pushHistory(nextNodes, edges);
    },
    [screenToFlowPosition, setNodes, nodes, edges, pushHistory]
  );

  // Save Node Config from Dialog
  const handleSaveNodeConfig = (nodeId: string, updatedData: Partial<HRNodeData>) => {
    const nextNodes = nodes.map((n) =>
      n.id === nodeId
        ? {
            ...n,
            data: {
              ...n.data,
              ...updatedData,
            },
          }
        : n
    );
    setNodes(nextNodes);
    pushHistory(nextNodes, edges);
  };

  // Delete Node from Dialog
  const handleDeleteNode = (nodeId: string) => {
    const nextNodes = nodes.filter((n) => n.id !== nodeId);
    const nextEdges = edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
    setNodes(nextNodes);
    setEdges(nextEdges);
    pushHistory(nextNodes, nextEdges);
  };

  // Live Run → queue worker; Test keeps a light client simulation
  const handleRunSimulation = async (isTestMode = false) => {
    setExecutionOpen(true);
    setIsRunning(true);
    const now = new Date().toLocaleTimeString();

    if (!isTestMode && workflowId) {
      setLogs([
        {
          timestamp: now,
          step: "⚡ [Live Run]",
          detail: "Saving & queueing execution for worker…",
          status: "running",
        },
      ]);
      try {
        await Promise.resolve(onSave(nodes, edges));
        const res = await fetch(`/api/workflows/${workflowId}/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

        const executionId = data.executionId as string;
        setLogs((prev) => [
          ...prev,
          {
            timestamp: new Date().toLocaleTimeString(),
            step: "Queued",
            detail: `Execution ${executionId.slice(-8)} ${
              data.enqueue?.enqueued
                ? "pushed to Redis → worker will claim"
                : data.enqueue?.reason ||
                  "queued in DB but Redis enqueue failed — start Redis + worker"
            }`,
            status: "success",
          },
        ]);

        // Poll until terminal status
        const poll = async () => {
          for (let i = 0; i < 60; i++) {
            await new Promise((r) => setTimeout(r, 1500));
            const statusRes = await fetch(`/api/executions/${executionId}`);
            const statusJson = await statusRes.json();
            if (!statusRes.ok) throw new Error(statusJson.error || "Poll failed");
            const ex = statusJson.execution;
            const nodeLogs: ExecutionLog[] = (ex.nodeExecutions || []).map(
              (ne: any) => ({
                timestamp: ne.startedAt
                  ? new Date(ne.startedAt).toLocaleTimeString()
                  : new Date().toLocaleTimeString(),
                step: ne.node?.name || ne.node?.type || "Node",
                detail:
                  ne.error ||
                  (ne.output ? JSON.stringify(ne.output).slice(0, 180) : ne.status),
                status:
                  ne.status === "SUCCESS"
                    ? ("success" as const)
                    : ne.status === "FAILED"
                      ? ("error" as const)
                      : ("running" as const),
              }),
            );
            setLogs([
              {
                timestamp: now,
                step: "⚡ [Live Run]",
                detail: `Status: ${ex.status}`,
                status:
                  ex.status === "FAILED"
                    ? "error"
                    : ex.status === "SUCCESS"
                      ? "success"
                      : "running",
              },
              ...nodeLogs,
            ]);
            if (ex.status === "SUCCESS" || ex.status === "FAILED" || ex.status === "CANCELLED") {
              setIsRunning(false);
              if (ex.error) {
                setLogs((prev) => [
                  ...prev,
                  {
                    timestamp: new Date().toLocaleTimeString(),
                    step: "Error",
                    detail: ex.error,
                    status: "error",
                  },
                ]);
              }
              return;
            }
          }
          setIsRunning(false);
          setLogs((prev) => [
            ...prev,
            {
              timestamp: new Date().toLocaleTimeString(),
              step: "Timeout",
              detail: "Still running — check worker logs. Execution remains in DB.",
              status: "error",
            },
          ]);
        };
        void poll();
      } catch (err: any) {
        setIsRunning(false);
        setLogs((prev) => [
          ...prev,
          {
            timestamp: new Date().toLocaleTimeString(),
            step: "Error",
            detail: err.message || "Failed to start run",
            status: "error",
          },
        ]);
      }
      return;
    }

    setLogs([
      {
        timestamp: now,
        step: isTestMode ? "⚡ [Test Mode]" : "⚡ [Live Run]",
        detail: workflowId
          ? `Test simulation with ${nodes.length} nodes…`
          : "Save the workflow to the cloud to use live Run (worker).",
        status: "running",
      },
    ]);

    if (nodes.length === 0) {
      setTimeout(() => {
        setLogs((prev) => [
          ...prev,
          {
            timestamp: new Date().toLocaleTimeString(),
            step: "Warning",
            detail: "No nodes found on canvas. Add a trigger to begin.",
            status: "error",
          },
        ]);
        setIsRunning(false);
      }, 500);
      return;
    }

    nodes.forEach((node, index) => {
      setTimeout(() => {
        setNodes((nds) =>
          nds.map((n) => (n.id === node.id ? { ...n, data: { ...n.data, status: "running" } } : n))
        );

        const stepTime = new Date().toLocaleTimeString();
        const data = node.data as HRNodeData;

        setLogs((prev) => [
          ...prev,
          {
            timestamp: stepTime,
            step: `Step ${index + 1}: ${data.label}`,
            detail:
              data.nodeType === "READ_GOOGLE_SHEET"
                ? "Would fetch Google Sheet rows"
                : data.nodeType === "SEND_EMAIL"
                  ? `Would email ${data.config?.recipient || "{{item.email}}"} (${data.config?.attachmentMode || "shared"} PDF, ${data.config?.deliveryMode || "draft"})`
                  : data.nodeType === "FOR_EACH"
                    ? "Would iterate sheet rows"
                    : "Simulated successfully",
            status: "success",
          },
        ]);

        setTimeout(() => {
          setNodes((nds) =>
            nds.map((n) =>
              n.id === node.id ? { ...n, data: { ...n.data, status: "configured" } } : n
            )
          );

          if (index === nodes.length - 1) {
            setIsRunning(false);
            setLogs((prev) => [
              ...prev,
              {
                timestamp: new Date().toLocaleTimeString(),
                step: "Done",
                detail: "Test simulation finished (no emails sent).",
                status: "success",
              },
            ]);
          }
        }, 400);
      }, (index + 1) * 700);
    });
  };

  return (
    <div
      className="h-full w-full relative"
      onContextMenu={(e) => {
        // Prevent default browser right-click menu on canvas
        e.preventDefault();
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onPaneContextMenu={(e) => {
          e.preventDefault();
          setContextMenu(null);
        }}
        onDragOver={onDragOver}
        onDrop={onDrop}
        panOnDrag={isLocked ? false : activeTool === "hand" ? true : [1, 2]}
        nodesDraggable={!isLocked}
        nodesConnectable={!isLocked}
        elementsSelectable={!isLocked}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        onNodeDragStop={() => pushHistory(nodes, edges)}
        deleteKeyCode={["Backspace", "Delete"]}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{
          style: { stroke: "#94a3b8", strokeWidth: 2 },
          type: "smoothstep",
          interactionWidth: 30,
        }}
        fitView
        className="!bg-[#faf8f3]"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1.5}
          color="rgba(0,0,0,0.08)"
        />
        <Controls
          className="!bg-white/90 !border-[rgba(0,0,0,0.08)] !shadow-sm !rounded-xl !backdrop-blur-sm [&>button]:!bg-white [&>button]:!border-[rgba(0,0,0,0.08)] [&>button]:!text-[#232329] [&>button:hover]:!bg-[#ece8ff] [&>button:hover]:!text-[#6965db]"
          position="bottom-left"
        />
      </ReactFlow>

      {/* Left-side Vertical Tool Dock (Image 1 style) */}
      <CanvasDock
        onOpenNodeDrawer={() => setPaletteOpen(true)}
        onAddStickyNote={handleAddStickyNote}
        onToggleChat={() => setChatOpen((p) => !p)}
      />

      {/* Floating Toolbar with quick nodes, undo/redo, test/run */}
      <FloatingToolbar
        title={title}
        saveStatus={saveStatus}
        paletteOpen={paletteOpen}
        chatOpen={chatOpen}
        isLocked={isLocked}
        activeTool={activeTool}
        onToggleLock={() => setIsLocked((prev) => !prev)}
        onChangeActiveTool={setActiveTool}
        onTogglePalette={() => setPaletteOpen((p) => !p)}
        onAddStickyNote={handleAddStickyNote}
        onToggleChat={() => setChatOpen((p) => !p)}
        onQuickAddNode={handleAddNode}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onFitView={() => fitView({ padding: 0.2, duration: 400 })}
        onOpenSettings={() => setSettingsOpen(true)}
        onSave={() => onSave(nodes, edges)}
        onTest={() => handleRunSimulation(true)}
        onRun={() => handleRunSimulation(false)}
      />

      {/* n8n-style Node Drawer (Image 2 style) */}
      <FloatingNodePalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onAddNode={(type) => {
          handleAddNode(type);
        }}
        onAddStickyNote={handleAddStickyNote}
      />

      {/* Floating AI Assistant Copilot Panel */}
      <FloatingChatPanel
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        onOpen={() => setChatOpen(true)}
        activeNodeLabel={
          selectedNode
            ? (selectedNode.data as HRNodeData).label
            : nodes[0]
            ? (nodes[0].data as HRNodeData).label
            : "Create Employee"
        }
      />

      {/* Live Execution Logs Drawer */}
      <ExecutionLogDrawer
        open={executionOpen}
        onClose={() => setExecutionOpen(false)}
        isRunning={isRunning}
        logs={logs}
        workflowName={title}
      />

      {/* Node Config Dialog (Screen Blur & Freeze) */}
      <NodeConfigDialog
        open={!!selectedNode}
        node={selectedNode}
        workflowId={workflowId}
        onClose={() => setSelectedNode(null)}
        onSave={handleSaveNodeConfig}
        onDelete={handleDeleteNode}
      />

      {/* Workflow Settings & Rename Dialog */}
      <WorkflowSettingsDialog
        open={settingsOpen}
        currentName={title}
        onClose={() => setSettingsOpen(false)}
        onSave={onRenameWorkflow}
      />

      {/* Right-click Context Menu for Nodes & Connectors */}
      {contextMenu && (
        <div
          style={{
            top: Math.min(contextMenu.y, (typeof window !== "undefined" ? window.innerHeight : 800) - 180),
            left: Math.min(contextMenu.x, (typeof window !== "undefined" ? window.innerWidth : 1200) - 190),
          }}
          className="fixed z-[99999] min-w-[170px] rounded-2xl border border-[rgba(0,29,61,0.15)] bg-white p-1.5 shadow-2xl text-xs animate-in fade-in zoom-in-95 duration-100 backdrop-blur-md"
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === "node" ? (
            <>
              {nodes.find((n) => n.id === contextMenu.id)?.type !== "stickyNote" && (
                <button
                  type="button"
                  onClick={() => {
                    const target = nodes.find((n) => n.id === contextMenu.id);
                    if (target) setSelectedNode(target);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-[#f0fdfa] hover:text-[#0d9488] transition font-medium text-left"
                >
                  <Settings2 className="h-4 w-4" />
                  <span>Configure Node</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  handleDuplicateNode(contextMenu.id);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-[#f0fdfa] hover:text-[#0d9488] transition font-medium text-left"
              >
                <Copy className="h-4 w-4" />
                <span>Duplicate</span>
              </button>
              <div className="my-1 border-t border-slate-100" />
              <button
                type="button"
                onClick={() => {
                  handleDeleteNode(contextMenu.id);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition font-medium text-left"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete {nodes.find((n) => n.id === contextMenu.id)?.type === "stickyNote" ? "Note" : "Node"}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                handleDeleteEdge(contextMenu.id);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition font-medium text-left"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Connection</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
