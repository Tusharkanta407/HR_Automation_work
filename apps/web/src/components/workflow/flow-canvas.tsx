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
  initialNodes: Node[];
  initialEdges: Edge[];
  title: string;
  saveStatus: string;
  onSave: (currentNodes: Node[], currentEdges: Edge[]) => void;
  onRenameWorkflow: (newName: string) => void;
  onDirty?: () => void;
};

export default function FlowCanvas({
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
      if (onDirty) queueMicrotask(onDirty);
    },
    [historyIndex, onDirty]
  );

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setNodes(prev.nodes);
      setEdges(prev.edges);
      setHistoryIndex((i) => i - 1);
      if (onDirty) queueMicrotask(onDirty);
    }
  }, [history, historyIndex, setNodes, setEdges, onDirty]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setNodes(next.nodes);
      setEdges(next.edges);
      setHistoryIndex((i) => i + 1);
      if (onDirty) queueMicrotask(onDirty);
    }
  }, [history, historyIndex, setNodes, setEdges, onDirty]);

  // Connect handler supporting Branching Condition/IF (TRUE / FALSE)
  const onConnect = useCallback(
    (params: Connection) => {
      const isTrue = params.sourceHandle === "true";
      const isFalse = params.sourceHandle === "false";

      setEdges((eds) => {
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
          eds
        );
        pushHistory(nodes, nextEdges);
        return nextEdges;
      });
    },
    [setEdges, nodes, pushHistory]
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
      setNodes((nds) => {
        const nextNodes = [...nds.map((n) => ({ ...n, selected: false })), clonedNode];
        pushHistory(nextNodes, edges);
        return nextNodes;
      });
    },
    [nodes, edges, setNodes, pushHistory]
  );

  // Delete an edge connector
  const handleDeleteEdge = useCallback(
    (edgeId: string) => {
      setEdges((eds) => {
        const nextEdges = eds.filter((e) => e.id !== edgeId);
        pushHistory(nodes, nextEdges);
        return nextEdges;
      });
    },
    [nodes, setEdges, pushHistory]
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

  // Quick Add Node from Toolbar or Palette click (places at visible screen center)
  const handleAddNode = useCallback(
    (type: NodeType) => {
      const id = crypto.randomUUID();
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

      setNodes((nds) => {
        const nextNodes = [...nds, newNode];
        pushHistory(nextNodes, edges);
        return nextNodes;
      });
    },
    [nodes.length, edges, setNodes, pushHistory, screenToFlowPosition]
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

    setNodes((nds) => {
      const nextNodes = [...nds, newNote];
      pushHistory(nextNodes, edges);
      return nextNodes;
    });
  }, [nodes.length, edges, setNodes, pushHistory, screenToFlowPosition]);

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

      setNodes((nds) => {
        const nextNodes = [...nds, newNode];
        pushHistory(nextNodes, edges);
        return nextNodes;
      });
    },
    [screenToFlowPosition, setNodes, edges, pushHistory]
  );

  // Save Node Config from Dialog
  const handleSaveNodeConfig = (nodeId: string, updatedData: Partial<HRNodeData>) => {
    setNodes((nds) => {
      const nextNodes = nds.map((n) =>
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
      pushHistory(nextNodes, edges);
      return nextNodes;
    });
  };

  // Delete Node from Dialog
  const handleDeleteNode = (nodeId: string) => {
    setNodes((nds) => {
      const nextNodes = nds.filter((n) => n.id !== nodeId);
      setEdges((eds) => {
        const nextEdges = eds.filter((e) => e.source !== nodeId && e.target !== nodeId);
        pushHistory(nextNodes, nextEdges);
        return nextEdges;
      });
      return nextNodes;
    });
  };

  // Live Test / Run Simulation
  const handleRunSimulation = (isTestMode = false) => {
    setExecutionOpen(true);
    setIsRunning(true);
    const now = new Date().toLocaleTimeString();

    setLogs([
      {
        timestamp: now,
        step: isTestMode ? "⚡ [Test Mode]" : "⚡ [Live Run]",
        detail: `Initializing workflow execution with ${nodes.length} nodes...`,
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

    // Step through each node sequentially
    nodes.forEach((node, index) => {
      setTimeout(() => {
        // Set this node to running
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
              data.nodeType === "CONDITION"
                ? `Condition evaluated: ${data.config?.condition || "True"} -> Branch TRUE selected`
                : data.nodeType === "FOR_EACH"
                ? "Iterated 4 items successfully"
                : data.nodeType === "SEND_EMAIL"
                ? `Dispatched email template to ${data.config?.recipient || "{{candidate.email}}"}`
                : "Executed successfully without errors",
            status: "success",
          },
        ]);

        // Complete this node
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
                detail: "✨ All steps executed successfully with 0 errors.",
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
