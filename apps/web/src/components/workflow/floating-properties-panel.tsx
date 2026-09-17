"use client";

import { X } from "lucide-react";
import type { Node } from "@xyflow/react";
import { getNodeEntry, type NodeType } from "@/lib/workflow";
import type { HRNodeData } from "./custom-node";

type FloatingPropertiesPanelProps = {
  selectedNode: Node | null;
  onClose: () => void;
};

export default function FloatingPropertiesPanel({
  selectedNode,
  onClose,
}: FloatingPropertiesPanelProps) {
  if (!selectedNode) return null;

  const nodeData = selectedNode.data as unknown as HRNodeData;
  const entry = getNodeEntry(nodeData.nodeType);
  const Icon = entry?.icon;

  return (
    <div
      className={`
        absolute top-16 right-3 z-40 w-72
        bg-white rounded-xl border border-[rgba(0,29,61,0.08)]
        shadow-lg overflow-hidden
        animate-in slide-in-from-right-2 fade-in duration-200
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(0,29,61,0.06)]">
        <p className="text-xs font-semibold text-[#001d3d] uppercase tracking-wider">
          Properties
        </p>
        <button
          type="button"
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-lg text-[#94a3b8] hover:bg-[#faf8f3] hover:text-[#001d3d] transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-4">
        {/* Node identity */}
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f0fdfa]">
              <Icon className="h-5 w-5 text-[#14b8a6]" />
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-[#001d3d]">{nodeData.label}</p>
            <p className="text-xs text-[#94a3b8]">{entry?.description}</p>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-medium text-[#94a3b8] uppercase tracking-wider mb-1">
              Category
            </p>
            <p className="text-sm text-[#001d3d] font-medium">
              {entry?.category.replace("_", " ")}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-medium text-[#94a3b8] uppercase tracking-wider mb-1">
              Node ID
            </p>
            <p className="text-xs text-[#64748b] font-mono break-all bg-[#faf8f3] rounded-lg px-2.5 py-1.5">
              {selectedNode.id}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-medium text-[#94a3b8] uppercase tracking-wider mb-1">
              Position
            </p>
            <p className="text-xs text-[#64748b] font-mono">
              x: {Math.round(selectedNode.position.x)}, y: {Math.round(selectedNode.position.y)}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-medium text-[#94a3b8] uppercase tracking-wider mb-1">
              Configuration
            </p>
            <div className="rounded-lg border border-dashed border-[rgba(0,29,61,0.1)] bg-[#faf8f3] px-3 py-4 text-center">
              <p className="text-xs text-[#94a3b8]">
                Node configuration will be available here when the backend is connected.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
