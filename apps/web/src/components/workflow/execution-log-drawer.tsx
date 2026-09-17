"use client";

import { CheckCircle2, Clock, Loader2, Terminal, X } from "lucide-react";

export type ExecutionLog = {
  timestamp: string;
  step: string;
  detail: string;
  status: "success" | "running" | "error";
};

type ExecutionLogDrawerProps = {
  open: boolean;
  onClose: () => void;
  isRunning: boolean;
  logs: ExecutionLog[];
  workflowName: string;
};

export default function ExecutionLogDrawer({
  open,
  onClose,
  isRunning,
  logs,
  workflowName,
}: ExecutionLogDrawerProps) {
  if (!open) return null;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4 animate-in slide-in-from-bottom-4 duration-200">
      <div className="rounded-2xl border border-[rgba(0,29,61,0.08)] bg-white/95 backdrop-blur-md shadow-2xl p-4 text-[#001d3d]">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f0fdfa] text-[#0d9488]">
              <Terminal className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#001d3d]">
                Live Execution Logs — {workflowName}
              </span>
              <span className="ml-2 text-[10px] text-slate-400">
                {isRunning ? "Simulating execution..." : "Run completed successfully"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isRunning ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600">
                <Loader2 className="h-3 w-3 animate-spin" />
                Executing
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                <CheckCircle2 className="h-3 w-3" />
                Completed
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Logs terminal-like stream */}
        <div className="mt-3 max-h-48 overflow-y-auto space-y-1.5 font-mono text-[11px] bg-slate-50/70 rounded-xl p-3 border border-slate-100">
          {logs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <span className="text-slate-400 shrink-0">{log.timestamp}</span>
              <span className="font-semibold text-slate-700 shrink-0">{log.step}</span>
              <span className="text-slate-600">{log.detail}</span>
              {log.status === "success" && (
                <span className="text-emerald-600 shrink-0">✓ OK</span>
              )}
              {log.status === "running" && (
                <Loader2 className="h-3 w-3 animate-spin text-blue-500 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
