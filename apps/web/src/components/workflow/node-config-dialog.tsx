"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { type Node } from "@xyflow/react";
import {
  getNodeEntry,
  requiredConnectionType,
  defaultPathForNodeType,
} from "@/lib/workflow";
import { type HRNodeData } from "./custom-node";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Plus,
  Trash2,
  Variable,
  X,
  Plug,
  ExternalLink,
} from "lucide-react";

type SafeIntegration = {
  id: string;
  name: string;
  type: string;
  baseUrl: string | null;
  status: string;
};

type NodeConfigDialogProps = {
  node: Node | null;
  open: boolean;
  onClose: () => void;
  onSave: (nodeId: string, updatedData: Partial<HRNodeData>) => void;
  onDelete: (nodeId: string) => void;
};

const HR_VARIABLES = [
  { label: "Candidate Name", value: "{{candidate.name}}" },
  { label: "Candidate Email", value: "{{candidate.email}}" },
  { label: "Candidate Department", value: "{{candidate.department}}" },
  { label: "Candidate ID", value: "{{candidate.id}}" },
  { label: "Employee Name", value: "{{employee.name}}" },
  { label: "Employee Email", value: "{{employee.email}}" },
  { label: "Attendance Rate", value: "{{employee.attendance_rate}}" },
  { label: "Company Name", value: "{{company.name}}" },
];

export default function NodeConfigDialog({
  node,
  open,
  onClose,
  onSave,
  onDelete,
}: NodeConfigDialogProps) {
  const [label, setLabel] = useState("");
  const [config, setConfig] = useState<Record<string, any>>({});
  const [integrationId, setIntegrationId] = useState<string>("");
  const [integrations, setIntegrations] = useState<SafeIntegration[]>([]);
  const [loadingIntegrations, setLoadingIntegrations] = useState(false);
  const [activeField, setActiveField] = useState<string>("message");
  const [varDropdownOpen, setVarDropdownOpen] = useState(false);

  useEffect(() => {
    if (node) {
      const data = node.data as HRNodeData;
      setLabel(data.label || "");
      setConfig(data.config || {});
      setIntegrationId(data.integrationId || "");
    }
  }, [node]);

  useEffect(() => {
    if (!open || !node) return;
    const data = node.data as HRNodeData;
    const need = requiredConnectionType(data.nodeType);
    if (!need) {
      setIntegrations([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingIntegrations(true);
      try {
        const res = await fetch(`/api/integrations?type=${need}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) setIntegrations(json.integrations || []);
      } catch {
        if (!cancelled) setIntegrations([]);
      } finally {
        if (!cancelled) setLoadingIntegrations(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, node]);

  if (!open || !node) return null;

  const nodeData = node.data as HRNodeData;
  const entry = getNodeEntry(nodeData.nodeType);
  const Icon = entry?.icon;
  const connType = requiredConnectionType(nodeData.nodeType);
  const isCondition =
    nodeData.nodeType === "CONDITION" || nodeData.nodeType === "FILTER";
  const isEmail = nodeData.nodeType === "SEND_EMAIL";
  const isForEach = nodeData.nodeType === "FOR_EACH";
  const isApproval = nodeData.nodeType === "HUMAN_APPROVAL";
  const isCode = nodeData.nodeType === "CODE";
  const isRestAction =
    connType === "REST_API" ||
    nodeData.nodeType === "CUSTOM_API" ||
    nodeData.nodeType === "HTTP_REQUEST";
  const isWebhookAction = connType === "WEBHOOK";

  const handleInsertVariable = (varText: string) => {
    setConfig((prev) => {
      const currVal = prev[activeField] || "";
      return {
        ...prev,
        [activeField]: currVal + " " + varText,
      };
    });
    setVarDropdownOpen(false);
  };

  const handleApply = () => {
    let summaryText = "";
    if (isCondition) {
      const field = config.field || "attendance_rate";
      const op = config.operator || "<";
      const val = config.value || "75%";
      summaryText = `${field} ${op} ${val}`;
    } else if (isEmail) {
      summaryText = config.recipient
        ? `To: ${config.recipient}`
        : config.to
          ? `To: ${config.to}`
          : "";
    } else if (isForEach) {
      summaryText = config.collection
        ? `Each in ${config.collection}`
        : "Each Employee";
    } else if (isRestAction && config.path) {
      summaryText = `${config.method || "GET"} ${config.path}`;
    }

    const nextConfig = { ...config };
    if (isRestAction && !nextConfig.path) {
      nextConfig.path = defaultPathForNodeType(nodeData.nodeType);
    }
    if (isRestAction && !nextConfig.method) {
      nextConfig.method = "GET";
    }
    if (isEmail) {
      if (nextConfig.recipient && !nextConfig.to) {
        nextConfig.to = nextConfig.recipient;
      }
      if (nextConfig.message && !nextConfig.body) {
        nextConfig.body = nextConfig.message;
      }
    }

    onSave(node.id, {
      label: label.trim() || entry?.label || "Node",
      status: "configured",
      integrationId: connType ? integrationId || null : null,
      config: {
        ...nextConfig,
        condition: summaryText || nextConfig.condition,
        summary: summaryText,
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#001d3d]/30 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl bg-white border border-[rgba(0,29,61,0.08)] shadow-2xl p-6 relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f0fdfa] border border-[rgba(20,184,166,0.2)] text-[#0d9488]">
                <Icon className="h-6 w-6" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[#001d3d] leading-tight">
                  Configure Node
                </h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 uppercase">
                  {entry?.category || "HR"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{entry?.description}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Node Display Name
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={entry?.label || "Node Label"}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-[#001d3d] focus:ring-2 focus:ring-[#14b8a6] focus:outline-none"
            />
          </div>

          {connType && (
            <div className="rounded-xl bg-[#f0fdfa]/60 border border-[rgba(20,184,166,0.25)] p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#001d3d] flex items-center gap-1.5">
                  <Plug className="h-3.5 w-3.5 text-[#0d9488]" />
                  Connection
                </span>
                <Link
                  href="/dashboard/connections"
                  className="text-[11px] font-medium text-[#0d9488] hover:underline flex items-center gap-1"
                >
                  Manage <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
              <p className="text-[11px] text-slate-500">
                {connType === "REST_API" &&
                  "Pick your ATS / HR REST connection. Path and method below — not the API key."}
                {connType === "SMTP" &&
                  "Pick an SMTP connection. To / subject / body stay on this node."}
                {connType === "WEBHOOK" &&
                  "Pick a webhook destination connection."}
              </p>
              <select
                value={integrationId}
                onChange={(e) => setIntegrationId(e.target.value)}
                disabled={loadingIntegrations}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-[#001d3d]"
              >
                <option value="">
                  {loadingIntegrations
                    ? "Loading connections…"
                    : integrations.length === 0
                      ? "No connections — create one first"
                      : "Select a connection…"}
                </option>
                {integrations.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                    {i.baseUrl ? ` (${i.baseUrl})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isRestAction && (
            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-medium text-slate-500">
                    Method
                  </label>
                  <select
                    value={config.method || "GET"}
                    onChange={(e) =>
                      setConfig({ ...config, method: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-medium text-slate-500">
                    Path (appended to connection base URL)
                  </label>
                  <input
                    type="text"
                    value={
                      config.path ?? defaultPathForNodeType(nodeData.nodeType)
                    }
                    onChange={(e) =>
                      setConfig({ ...config, path: e.target.value })
                    }
                    placeholder="/api/attendance/monthly"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Worker calls:{" "}
                <code className="text-[10px]">
                  {"{baseUrl}"}
                  {config.path || defaultPathForNodeType(nodeData.nodeType)}
                </code>
              </p>
            </div>
          )}

          {isWebhookAction && (
            <p className="text-[11px] text-slate-500 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
              Target URL comes from the selected Webhook connection.
            </p>
          )}

          {isCondition && (
            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#001d3d]">
                  Rule Evaluation
                </span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  TRUE / FALSE Branches
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-medium text-slate-500">
                    Field
                  </label>
                  <select
                    value={config.field || "attendance_rate"}
                    onChange={(e) =>
                      setConfig({ ...config, field: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-[#001d3d]"
                  >
                    <option value="attendance_rate">Attendance Rate</option>
                    <option value="assessment_score">Assessment Score</option>
                    <option value="leave_balance">Leave Balance</option>
                    <option value="tenure_months">Tenure Months</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-medium text-slate-500">
                    Operator
                  </label>
                  <select
                    value={config.operator || "<"}
                    onChange={(e) =>
                      setConfig({ ...config, operator: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-[#001d3d]"
                  >
                    <option value="<">Less than (&lt;)</option>
                    <option value="<=">Less or equal (&le;)</option>
                    <option value=">">Greater than (&gt;)</option>
                    <option value=">=">Greater or equal (&ge;)</option>
                    <option value="==">Equal (==)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-medium text-slate-500">
                    Threshold
                  </label>
                  <input
                    type="text"
                    value={config.value || "75%"}
                    onChange={(e) =>
                      setConfig({ ...config, value: e.target.value })
                    }
                    placeholder="e.g. 75%"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-[#001d3d]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400">Presets:</span>
                {["75%", "80%", "90%", "0"].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setConfig({ ...config, value: preset })}
                    className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-medium text-slate-600 hover:border-[#14b8a6] hover:text-[#14b8a6]"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isForEach && (
            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 space-y-2.5">
              <div>
                <label className="text-xs font-semibold text-[#001d3d] block mb-1">
                  Collection to iterate
                </label>
                <select
                  value={config.collection || "{{employees}}"}
                  onChange={(e) =>
                    setConfig({ ...config, collection: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-[#001d3d]"
                >
                  <option value="{{employees}}">
                    Employees List ({"{{employees}}"})
                  </option>
                  <option value="{{candidates}}">
                    Candidates List ({"{{candidates}}"})
                  </option>
                  <option value="{{leave_records}}">
                    Leave Records ({"{{leave_records}}"})
                  </option>
                </select>
              </div>
              <p className="text-[11px] text-slate-500">
                Next connected nodes will execute once per item with variable{" "}
                <code>{`{{item}}`}</code>.
              </p>
            </div>
          )}

          {isEmail && (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Recipient (To)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveField("recipient");
                      setVarDropdownOpen((prev) => !prev);
                    }}
                    className="text-[11px] font-medium text-[#0d9488] hover:underline flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Insert variable
                  </button>
                </div>
                <input
                  type="text"
                  value={config.recipient || config.to || "{{candidate.email}}"}
                  onFocus={() => setActiveField("recipient")}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      recipient: e.target.value,
                      to: e.target.value,
                    })
                  }
                  placeholder="e.g. {{candidate.email}} or manager@company.com"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-[#001d3d] focus:ring-2 focus:ring-[#14b8a6]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={config.subject || "Welcome to {{company.name}}!"}
                  onFocus={() => setActiveField("subject")}
                  onChange={(e) =>
                    setConfig({ ...config, subject: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-[#001d3d] focus:ring-2 focus:ring-[#14b8a6]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Message Body
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveField("message");
                      setVarDropdownOpen((prev) => !prev);
                    }}
                    className="text-[11px] font-medium text-[#0d9488] hover:underline flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Insert variable
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={
                    config.message ||
                    config.body ||
                    "Hi {{candidate.name}},\n\nWelcome to the team! Your onboarding session is scheduled.\n\nBest regards,\nHR Operations"
                  }
                  onFocus={() => setActiveField("message")}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      message: e.target.value,
                      body: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-[#001d3d] focus:ring-2 focus:ring-[#14b8a6]"
                />
              </div>
            </div>
          )}

          {isApproval && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Approver Role
                </label>
                <select
                  value={config.approverRole || "manager"}
                  onChange={(e) =>
                    setConfig({ ...config, approverRole: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-[#001d3d]"
                >
                  <option value="manager">Reporting Manager</option>
                  <option value="hr_director">HR Director</option>
                  <option value="finance_lead">Finance Lead</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Timeout (Auto-escalate)
                </label>
                <select
                  value={config.timeout || "24h"}
                  onChange={(e) =>
                    setConfig({ ...config, timeout: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-[#001d3d]"
                >
                  <option value="24h">24 Hours</option>
                  <option value="48h">48 Hours</option>
                  <option value="7d">7 Days</option>
                </select>
              </div>
            </div>
          )}

          {isCode && (
            <p className="text-[11px] text-slate-500">
              Custom code runs in the worker (Phase 6). No external connection
              required.
            </p>
          )}

          {varDropdownOpen && (
            <div className="rounded-xl border border-[#14b8a6]/30 bg-[#f0fdfa] p-3 animate-in fade-in">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#0d9488] flex items-center gap-1.5">
                  <Variable className="h-3.5 w-3.5" /> Insert Variable into &quot;
                  {activeField}&quot;
                </span>
                <button
                  type="button"
                  onClick={() => setVarDropdownOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {HR_VARIABLES.map((v) => (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => handleInsertVariable(v.value)}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-left text-[11px] hover:border-[#14b8a6] hover:bg-emerald-50/50 transition"
                  >
                    <span className="text-slate-700 font-medium">{v.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {v.value}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl bg-emerald-50/80 border border-emerald-200/60 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <div>
                <p className="text-xs font-semibold text-emerald-900">
                  Ready to Execute
                </p>
                <p className="text-[11px] text-emerald-700">
                  {connType && !integrationId
                    ? "Select a connection before Run Now will succeed."
                    : "Parameters validated for this HR workflow step."}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-white px-2 py-0.5 rounded shadow-2xs border border-emerald-200">
              Configured
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onDelete(node.id);
              onClose();
            }}
            className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded-lg transition"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete Node</span>
          </button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs rounded-xl border-slate-200"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              className="bg-[#14b8a6] hover:bg-[#0d9488] text-white text-xs rounded-xl shadow-xs"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
