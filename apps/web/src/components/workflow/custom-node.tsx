"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { getNodeEntry, type NodeType } from "@/lib/workflow";
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";

export type HRNodeData = {
  label: string;
  nodeType: NodeType;
  status?: "needs_config" | "configured" | "running" | "failed";
  config?: Record<string, any>;
  subtitle?: string;
};

function HRCustomNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as HRNodeData;
  const entry = getNodeEntry(nodeData.nodeType);
  const Icon = entry?.icon;

  const isCondition = nodeData.nodeType === "CONDITION";
  const status = nodeData.status || "needs_config";

  // Dynamic summary text if configured
  const summary =
    nodeData.subtitle ||
    (isCondition && nodeData.config?.condition
      ? nodeData.config.condition
      : nodeData.nodeType === "FILTER" && nodeData.config?.condition
      ? nodeData.config.condition
      : nodeData.nodeType === "FOR_EACH"
      ? (nodeData.config?.collection ? `Each in ${nodeData.config.collection}` : "Each Employee")
      : nodeData.nodeType === "SEND_EMAIL" && nodeData.config?.recipient
      ? `To: ${nodeData.config.recipient}`
      : "");

  return (
    <div className="relative">
      {/* Top Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3.5 !h-3.5 !bg-[#14b8a6] !border-2 !border-white !-top-2 transition-transform hover:scale-125"
        title="Input"
      />

      {/* Main Node Card */}
      <div
        className={`
          group relative bg-white rounded-2xl border px-4 py-3.5 min-w-[210px] max-w-[240px]
          shadow-xs transition-all duration-200 cursor-pointer
          ${
            selected
              ? "border-[#14b8a6] shadow-[0_0_0_2px_rgba(20,184,166,0.2)]"
              : "border-[rgba(0,29,61,0.08)] hover:border-[rgba(20,184,166,0.3)] hover:shadow-md"
          }
        `}
      >
        <div className="flex items-start gap-3">
          {/* Bigger, richer icon badge */}
          {Icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f0fdfa] border border-[rgba(20,184,166,0.15)] shadow-2xs">
              <Icon className="h-5 w-5 text-[#0d9488]" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#001d3d] leading-snug truncate">
              {nodeData.label}
            </p>
            {entry?.category && (
              <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">
                {entry.category.replace("_", " ")}
              </p>
            )}
          </div>
        </div>

        {/* Configured subtitle/property preview */}
        {summary && (
          <div className="mt-2.5 rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 truncate">
            {summary}
          </div>
        )}

        {/* Node Status Indicator */}
        <div className="mt-2.5 pt-2 border-t border-slate-100/80 flex items-center justify-between">
          {status === "running" ? (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-blue-600">
              <Loader2 className="h-3 w-3 animate-spin" />
              Running...
            </span>
          ) : status === "failed" ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600">
              <XCircle className="h-3 w-3" />
              Failed
            </span>
          ) : status === "configured" ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
              <CheckCircle2 className="h-3 w-3" />
              Configured
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600">
              <AlertTriangle className="h-3 w-3" />
              Needs configuration
            </span>
          )}

          <span className="text-[9px] text-slate-400 font-medium">Click to edit</span>
        </div>
      </div>

      {/* Output Handles */}
      {isCondition ? (
        /* Dual Branching Handles for Condition / IF */
        <div className="flex justify-between items-center px-6 -mt-1.5 relative z-10">
          {/* True Branch */}
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-bold text-emerald-600 bg-white px-1 rounded shadow-2xs border border-emerald-200 mb-0.5">
              TRUE
            </span>
            <Handle
              id="true"
              type="source"
              position={Position.Bottom}
              className="!w-3.5 !h-3.5 !bg-emerald-500 !border-2 !border-white !relative !top-0 !left-0 !transform-none transition-transform hover:scale-125"
              title="True branch"
            />
          </div>

          {/* False Branch */}
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-bold text-rose-600 bg-white px-1 rounded shadow-2xs border border-rose-200 mb-0.5">
              FALSE
            </span>
            <Handle
              id="false"
              type="source"
              position={Position.Bottom}
              className="!w-3.5 !h-3.5 !bg-rose-500 !border-2 !border-white !relative !top-0 !left-0 !transform-none transition-transform hover:scale-125"
              title="False branch"
            />
          </div>
        </div>
      ) : (
        /* Normal Single Output Handle */
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3.5 !h-3.5 !bg-[#14b8a6] !border-2 !border-white !-bottom-2 transition-transform hover:scale-125"
          title="Output"
        />
      )}
    </div>
  );
}

export default memo(HRCustomNode);
