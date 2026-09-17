"use client";

import { useState, type DragEvent } from "react";
import { ChevronRight } from "lucide-react";
import {
  CATEGORIES,
  getNodesByCategory,
  type NodeCategory,
  type NodeCatalogEntry,
  type NodeType,
} from "@/lib/workflow";

type FloatingNodePaletteProps = {
  open: boolean;
};

export default function FloatingNodePalette({ open }: FloatingNodePaletteProps) {
  const [expandedCategory, setExpandedCategory] = useState<NodeCategory | null>("TRIGGERS");

  const toggleCategory = (cat: NodeCategory) => {
    setExpandedCategory((prev) => (prev === cat ? null : cat));
  };

  const onDragStart = (event: DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData("application/reactflow-type", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  if (!open) return null;

  return (
    <div
      className={`
        absolute top-16 left-3 z-40 w-64
        bg-white rounded-xl border border-[rgba(0,29,61,0.08)]
        shadow-lg overflow-hidden
        animate-in slide-in-from-left-2 fade-in duration-200
      `}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-[rgba(0,29,61,0.06)]">
        <p className="text-xs font-semibold text-[#001d3d] uppercase tracking-wider">
          Node Library
        </p>
      </div>

      {/* Accordion categories */}
      <div className="max-h-[calc(100vh-160px)] overflow-y-auto">
        {CATEGORIES.map((cat) => {
          const isExpanded = expandedCategory === cat.key;
          const nodes = getNodesByCategory(cat.key);

          return (
            <div key={cat.key}>
              {/* Category header */}
              <button
                type="button"
                onClick={() => toggleCategory(cat.key)}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-[#faf8f3]"
              >
                <span className="text-xs font-semibold text-[#001d3d]/70 uppercase tracking-wider">
                  {cat.label}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[#94a3b8] font-medium">
                    {nodes.length}
                  </span>
                  <ChevronRight
                    className={`h-3.5 w-3.5 text-[#94a3b8] transition-transform duration-200 ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                  />
                </div>
              </button>

              {/* Expanded node list */}
              <div
                className={`overflow-hidden transition-all duration-200 ease-in-out ${
                  isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="px-2 pb-2">
                  {nodes.map((node) => (
                    <NodeItem
                      key={node.type}
                      node={node}
                      onDragStart={(e) => onDragStart(e, node.type)}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NodeItem({
  node,
  onDragStart,
}: {
  node: NodeCatalogEntry;
  onDragStart: (e: DragEvent) => void;
}) {
  const Icon = node.icon;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 cursor-grab active:cursor-grabbing
        transition-all duration-150
        hover:bg-[#f0fdfa] hover:shadow-sm
        border border-transparent hover:border-[rgba(20,184,166,0.15)]"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f0fdfa]">
        <Icon className="h-3.5 w-3.5 text-[#14b8a6]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-[#001d3d] leading-tight truncate">
          {node.label}
        </p>
        <p className="text-[10px] text-[#94a3b8] leading-tight truncate">
          {node.description}
        </p>
      </div>
    </div>
  );
}
