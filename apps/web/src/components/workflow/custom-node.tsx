"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { getNodeEntry, type NodeType } from "@/lib/workflow";

export type HRNodeData = {
  label: string;
  nodeType: NodeType;
};

function HRCustomNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as HRNodeData;
  const entry = getNodeEntry(nodeData.nodeType);
  const Icon = entry?.icon;

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-[#14b8a6] !border-2 !border-white !-top-1.5"
      />
      <div
        className={`
          group relative bg-white rounded-xl border px-4 py-3 min-w-[180px] max-w-[220px]
          shadow-sm transition-all duration-200 cursor-grab active:cursor-grabbing
          ${selected
            ? "border-[#14b8a6] shadow-[0_0_0_2px_rgba(20,184,166,0.15)]"
            : "border-[rgba(0,29,61,0.08)] hover:border-[rgba(0,29,61,0.15)] hover:shadow-md"
          }
        `}
      >
        <div className="flex items-start gap-2.5">
          {Icon && (
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f0fdfa]">
              <Icon className="h-4 w-4 text-[#14b8a6]" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#001d3d] leading-tight truncate">
              {nodeData.label}
            </p>
            {entry?.category && (
              <p className="mt-0.5 text-[10px] font-medium text-[#94a3b8] uppercase tracking-wider">
                {entry.category.replace("_", " ")}
              </p>
            )}
          </div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-[#14b8a6] !border-2 !border-white !-bottom-1.5"
      />
    </>
  );
}

export default memo(HRCustomNode);
