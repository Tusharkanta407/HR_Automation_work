"use client";

import { useCallback, useEffect, useRef, type DragEvent } from "react";
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
import { nodeLabel, type NodeType } from "@/lib/workflow";

const nodeTypes = { hrNode: HRCustomNode };

type FlowCanvasProps = {
  initialNodes: Node[];
  initialEdges: Edge[];
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
  onNodeSelect?: (node: Node | null) => void;
  children?: React.ReactNode;
};

export default function FlowCanvas({
  initialNodes,
  initialEdges,
  onNodesChange: onNodesChangeProp,
  onEdgesChange: onEdgesChangeProp,
  onNodeSelect,
  children,
}: FlowCanvasProps) {
  const [nodes, setNodes, handleNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, handleEdgesChange] = useEdgesState(initialEdges);
  const { screenToFlowPosition } = useReactFlow();

  const isNodesMounted = useRef(false);
  const isEdgesMounted = useRef(false);

  // Sync node changes cleanly after render
  useEffect(() => {
    if (!isNodesMounted.current) {
      isNodesMounted.current = true;
      return;
    }
    onNodesChangeProp?.(nodes);
  }, [nodes, onNodesChangeProp]);

  // Sync edge changes cleanly after render
  useEffect(() => {
    if (!isEdgesMounted.current) {
      isEdgesMounted.current = true;
      return;
    }
    onEdgesChangeProp?.(edges);
  }, [edges, onEdgesChangeProp]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            style: { stroke: "#94a3b8", strokeWidth: 2 },
            type: "smoothstep",
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onNodeSelect?.(node);
    },
    [onNodeSelect]
  );

  const onPaneClick = useCallback(() => {
    onNodeSelect?.(null);
  }, [onNodeSelect]);

  // ── Drag-and-drop from palette ──
  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow-type") as NodeType;
      if (!type) return;

      // Accurately project screen drop coordinates onto the flow canvas
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
        } satisfies HRNodeData,
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [screenToFlowPosition, setNodes]
  );

  return (
    <div className="h-full w-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{
          style: { stroke: "#94a3b8", strokeWidth: 2 },
          type: "smoothstep",
        }}
        fitView
        className="!bg-[#faf8f3]"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1.5}
          color="rgba(0,29,61,0.12)"
        />
        <Controls
          className="!bg-white/90 !border-[rgba(0,29,61,0.08)] !shadow-sm !rounded-xl !backdrop-blur-sm [&>button]:!bg-white [&>button]:!border-[rgba(0,29,61,0.08)] [&>button]:!text-[#001d3d] [&>button:hover]:!bg-[#f0fdfa]"
          position="bottom-left"
        />
      </ReactFlow>
      {/* Floating UI panels rendered on top */}
      {children}
    </div>
  );
}
