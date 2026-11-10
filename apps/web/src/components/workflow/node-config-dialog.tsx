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
  Globe,
  Sparkles,
  Copy,
  Check,
  Send,
  Radio,
  Terminal,
  KeyRound,
  Loader2,
  Table2,
  FileUp,
} from "lucide-react";

export const PRESET_ENDPOINTS = [
  { id: "emp-list", group: "Employees", label: "GET /api/employees — All employees directory", method: "GET", path: "/api/employees" },
  { id: "emp-one", group: "Employees", label: "GET /api/employees/{id} — Single employee profile", method: "GET", path: "/api/employees/EMP-101" },
  { id: "emp-create", group: "Employees", label: "POST /api/employees — Provision new employee", method: "POST", path: "/api/employees", defaultBody: '{\n  "name": "Jane Doe",\n  "email": "jane.doe@example.com",\n  "department": "Engineering",\n  "position": "Software Engineer",\n  "salary": 115000,\n  "status": "ACTIVE"\n}' },
  { id: "emp-patch", group: "Employees", label: "PATCH /api/employees/{id} — Update employee", method: "PATCH", path: "/api/employees/EMP-101", defaultBody: '{\n  "position": "Staff Engineer",\n  "salary": 135000\n}' },
  { id: "att-list", group: "Attendance", label: "GET /api/attendance — List attendance logs", method: "GET", path: "/api/attendance" },
  { id: "att-low", group: "Attendance", label: "GET /api/attendance?belowThresholdOnly=true — Alert low attendance (<75%)", method: "GET", path: "/api/attendance?belowThresholdOnly=true" },
  { id: "att-monthly", group: "Attendance", label: "GET /api/attendance/monthly — Monthly attendance summary", method: "GET", path: "/api/attendance/monthly?period=2026-09" },
  { id: "leave-list", group: "Leaves", label: "GET /api/leave — List leave records & requests", method: "GET", path: "/api/leave" },
  { id: "leave-pending", group: "Leaves", label: "GET /api/leave?status=PENDING — Pending leave requests", method: "GET", path: "/api/leave?status=PENDING" },
  { id: "cand-list", group: "Candidates", label: "GET /api/candidates — Candidate pipeline", method: "GET", path: "/api/candidates" },
  { id: "cand-one", group: "Candidates", label: "GET /api/candidates/{id} — Single candidate details", method: "GET", path: "/api/candidates/CAND-201" },
  { id: "cand-status", group: "Candidates", label: "PATCH /api/candidates/{id}/status — Update candidate status/stage", method: "PATCH", path: "/api/candidates/CAND-201/status", defaultBody: '{\n  "stage": "OFFER",\n  "status": "ACTIVE"\n}' },
  { id: "asm-one", group: "Assessments", label: "GET /api/assessments/{id} — Candidate assessment scores", method: "GET", path: "/api/assessments/ASM-301" },
  { id: "intv-list", group: "Interviews", label: "GET /api/interviewers — List available interviewers", method: "GET", path: "/api/interviewers" },
  { id: "intv-avail", group: "Interviews", label: "GET /api/interviewers/availability — Check slot availability", method: "GET", path: "/api/interviewers/availability?interviewerId=INTV-401" },
  { id: "intv-sched", group: "Interviews", label: "POST /api/interviews — Schedule interview & Meet link", method: "POST", path: "/api/interviews", defaultBody: '{\n  "candidateId": "CAND-201",\n  "interviewerId": "INTV-401",\n  "scheduledAt": "2026-10-06T14:00:00Z",\n  "durationMinutes": 45\n}' },
  { id: "intv-assign", group: "Interviews", label: "POST /api/interviews/assign — Assign interviewer to candidate", method: "POST", path: "/api/interviews/assign", defaultBody: '{\n  "candidateId": "CAND-202",\n  "interviewerId": "INTV-402",\n  "date": "2026-10-07T10:00:00Z"\n}' },
  { id: "onb-task", group: "Onboarding", label: "POST /api/onboarding/tasks — Create onboarding checklist task", method: "POST", path: "/api/onboarding/tasks", defaultBody: '{\n  "employeeId": "EMP-101",\n  "title": "Complete Security Compliance Training",\n  "description": "Set up MFA and workstation keys",\n  "dueDate": "2026-10-10T18:00:00Z"\n}' },
  { id: "http-echo", group: "Webhooks / Echo", label: "ALL /api/http-request — Universal echo test endpoint", method: "POST", path: "/api/http-request", defaultBody: '{\n  "test": true,\n  "action": "webhook_verification"\n}' },
];

type SafeIntegration = {
  id: string;
  name: string;
  type: string;
  baseUrl: string | null;
  status: string;
};

type NodeConfigDialogProps = {
  workflowId?: string;
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
  { label: "Sheet row email", value: "{{item.email}}" },
  { label: "Sheet row name", value: "{{item.name}}" },
];

type SheetPreviewRow = {
  rowIndex: number;
  email: string | null;
  name: string | null;
  driveFileId: string | null;
  attachmentName?: string | null;
  attachmentStatus?: string;
};

export default function NodeConfigDialog({
  workflowId,
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

  // Webhook-specific state
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [testingTrigger, setTestingTrigger] = useState(false);
  const [triggerTestResult, setTriggerTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [testingDispatch, setTestingDispatch] = useState(false);
  const [dispatchTestResult, setDispatchTestResult] = useState<any | null>(null);

  // Google Sheet / offer-letter preview
  const [sheetPreviewLoading, setSheetPreviewLoading] = useState(false);
  const [sheetPreviewError, setSheetPreviewError] = useState<string | null>(null);
  const [sheetPreviewRows, setSheetPreviewRows] = useState<SheetPreviewRow[]>([]);
  const [sheetHeaders, setSheetHeaders] = useState<string[]>([]);
  const [sharedFileLabel, setSharedFileLabel] = useState<string | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  useEffect(() => {
    if (node) {
      const data = node.data as HRNodeData;
      setLabel(data.label || "");
      setConfig(data.config || {});
      setIntegrationId(data.integrationId || "");
      setTriggerTestResult(null);
      setDispatchTestResult(null);
      setSheetPreviewRows([]);
      setSheetPreviewError(null);
      setSheetHeaders([]);
      setSharedFileLabel(null);
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
  const isGoogleSheet = nodeData.nodeType === "READ_GOOGLE_SHEET";
  const isForEach = nodeData.nodeType === "FOR_EACH";
  const isApproval = nodeData.nodeType === "HUMAN_APPROVAL";
  const isCode = nodeData.nodeType === "CODE";
  const isRestAction =
    connType === "REST_API" ||
    nodeData.nodeType === "CUSTOM_API" ||
    nodeData.nodeType === "HTTP_REQUEST";
  const isWebhookTrigger = nodeData.nodeType === "WEBHOOK";
  const isSendWebhook = nodeData.nodeType === "SEND_WEBHOOK" || connType === "WEBHOOK";

  const handleSheetPreview = async (opts?: { resolveFiles?: boolean }) => {
    if (!integrationId) {
      setSheetPreviewError("Select a Google Workspace connection first");
      return;
    }
    const spreadsheetId = config.spreadsheetId || config.spreadsheetUrl;
    if (!spreadsheetId) {
      setSheetPreviewError("Paste a Google Sheet URL or spreadsheet ID");
      return;
    }
    setSheetPreviewLoading(true);
    setSheetPreviewError(null);
    try {
      const res = await fetch("/api/integrations/google/sheets/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          integrationId,
          spreadsheetId,
          sheetName: config.sheetName || "Sheet1",
          range: config.range || undefined,
          emailColumn: config.emailColumn || "email",
          nameColumn: config.nameColumn || "name",
          driveFileColumn:
            config.attachmentMode === "per_row" || isGoogleSheet
              ? config.driveFileColumn || null
              : null,
          resolveFiles: Boolean(opts?.resolveFiles),
          maxRows: 50,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setSheetHeaders(data.headers || []);
      setSheetPreviewRows(data.rows || []);
    } catch (err: any) {
      setSheetPreviewError(err.message || "Preview failed");
      setSheetPreviewRows([]);
    } finally {
      setSheetPreviewLoading(false);
    }
  };

  const handleResolveSharedFile = async () => {
    if (!integrationId || !config.sharedDriveFileId) return;
    try {
      const res = await fetch("/api/integrations/google/drive/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          integrationId,
          fileId: config.sharedDriveFileId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setSharedFileLabel(data.file?.name || data.file?.id);
      setConfig({
        ...config,
        sharedDriveFileId: data.file?.id || config.sharedDriveFileId,
        sharedDriveFileName: data.file?.name,
      });
    } catch (err: any) {
      setSharedFileLabel(err.message || "Could not resolve file");
    }
  };

  const handleUploadSharedPdf = async (file: File | null) => {
    if (!file || !integrationId) return;
    setUploadingPdf(true);
    try {
      const form = new FormData();
      form.append("integrationId", integrationId);
      form.append("file", file);
      const res = await fetch("/api/integrations/google/drive/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setConfig({
        ...config,
        attachmentMode: "shared",
        sharedDriveFileId: data.file.id,
        sharedDriveFileName: data.file.name,
      });
      setSharedFileLabel(data.file.name);
    } catch (err: any) {
      setSharedFileLabel(err.message || "Upload failed");
    } finally {
      setUploadingPdf(false);
    }
  };

  const webhookUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/webhooks/${workflowId || "WORKFLOW_ID"}`
    : `/api/webhooks/${workflowId || "WORKFLOW_ID"}`;

  const handleCopyWebhookUrl = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(webhookUrl);
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2000);
    }
  };

  const handleTestWebhookTrigger = async () => {
    if (!workflowId) {
      setTriggerTestResult({ ok: false, message: "Save workflow first to get a valid workflowId" });
      return;
    }
    setTestingTrigger(true);
    setTriggerTestResult(null);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (config.secret) {
        headers["x-webhook-secret"] = config.secret;
      }
      const res = await fetch(`/api/webhooks/${workflowId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          test: true,
          event: "webhook_test_event",
          timestamp: new Date().toISOString(),
          sample_candidate: {
            name: "Alex Rivera",
            email: "alex.rivera@example.com",
            department: "Engineering",
          },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTriggerTestResult({
          ok: true,
          message: `Execution #${data.executionId?.slice(-6) || "OK"} queued successfully!`,
        });
      } else {
        setTriggerTestResult({ ok: false, message: data.error || `HTTP ${res.status}` });
      }
    } catch (err: any) {
      setTriggerTestResult({ ok: false, message: err.message || "Failed to call webhook endpoint" });
    } finally {
      setTestingTrigger(false);
    }
  };

  const handleTestWebhookDispatch = async () => {
    if (!config.url) return;
    setTestingDispatch(true);
    setDispatchTestResult(null);
    try {
      let parsedHeaders = {};
      if (config.headersJson) {
        try {
          parsedHeaders = JSON.parse(config.headersJson);
        } catch {}
      }
      let parsedBody: unknown = undefined;
      if (config.bodyJson) {
        try {
          parsedBody = JSON.parse(config.bodyJson);
        } catch {
          parsedBody = config.bodyJson;
        }
      }
      const res = await fetch("/api/webhooks/test-dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: config.url,
          method: config.method || "POST",
          headers: parsedHeaders,
          body: parsedBody || { test: true, triggeredAt: new Date().toISOString() },
        }),
      });
      const data = await res.json();
      setDispatchTestResult(data);
    } catch (err: any) {
      setDispatchTestResult({ ok: false, error: err.message || "Dispatch error" });
    } finally {
      setTestingDispatch(false);
    }
  };

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
    } else if (isWebhookTrigger) {
      summaryText = config.secret ? "POST /api/webhooks/… (Secret Protected)" : "POST /api/webhooks/…";
    } else if (isSendWebhook && config.url) {
      summaryText = `${config.method || "POST"} ${config.url.length > 28 ? config.url.slice(0, 28) + "…" : config.url}`;
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
                {connType === "OAUTH" &&
                  "Pick your Google Workspace connection (Sheets / Drive / Gmail)."}
                {connType === "EMAIL" &&
                  "Prefer Google Workspace (Gmail + Drive attachments). SMTP remains a fallback."}
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
              {/* Endpoint Preset Picker */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-semibold text-[#001d3d] uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-[#0d9488]" /> Quick Endpoint Preset
                  </label>
                  <a
                    href="https://hr-automation-work.onrender.com/swagger/index.html"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#0d9488] hover:underline"
                  >
                    View Swagger <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
                <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">
                  {PRESET_ENDPOINTS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        setConfig({
                          ...config,
                          method: p.method,
                          path: p.path,
                          ...(p.defaultBody ? { bodyJson: p.defaultBody } : {}),
                        })
                      }
                      className={`block w-full px-2.5 py-1.5 text-left text-[11px] hover:bg-[#f0fdfa] ${
                        config.path === p.path && config.method === p.method
                          ? "bg-[#f0fdfa] text-[#0d9488] font-medium"
                          : "text-[#001d3d]"
                      }`}
                    >
                      <span className="text-[9px] uppercase tracking-wide text-slate-400 mr-1.5">
                        {p.group}
                      </span>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

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
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold"
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
                    Endpoint Path
                  </label>
                  <input
                    type="text"
                    value={
                      config.path ?? defaultPathForNodeType(nodeData.nodeType)
                    }
                    onChange={(e) =>
                      setConfig({ ...config, path: e.target.value })
                    }
                    placeholder="/api/employees"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>

              {(config.method === "POST" || config.method === "PUT" || config.method === "PATCH") && (
                <div>
                  <label className="text-[10px] font-medium text-slate-500 block mb-1">
                    JSON Request Body (supports <code className="text-[9px]">{"{{variables}}"}</code>)
                  </label>
                  <textarea
                    rows={3}
                    value={config.bodyJson || ""}
                    onChange={(e) => setConfig({ ...config, bodyJson: e.target.value })}
                    placeholder='{ "key": "value" }'
                    className="w-full rounded-lg border border-slate-200 bg-white p-2 font-mono text-[11px] leading-tight focus:border-[#0d9488] focus:outline-hidden"
                  />
                </div>
              )}

              <p className="text-[11px] text-slate-400">
                Worker calls:{" "}
                <code className="text-[10px] text-[#001d3d] bg-slate-100 px-1 py-0.5 rounded font-mono">
                  {"{baseUrl}"}
                  {config.path || defaultPathForNodeType(nodeData.nodeType)}
                </code>
              </p>
            </div>
          )}

          {isWebhookTrigger && (
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#001d3d] flex items-center gap-1.5">
                  <Radio className="h-4 w-4 text-[#0d9488]" />
                  Inbound Webhook Trigger
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  POST Endpoint
                </span>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Unique Webhook URL
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={webhookUrl}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-mono text-slate-700 select-all"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleCopyWebhookUrl}
                    className="h-8 px-2.5 rounded-lg border-slate-200 text-xs font-semibold text-[#001d3d] hover:bg-slate-100"
                  >
                    {copiedWebhook ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span className="ml-1">{copiedWebhook ? "Copied" : "Copy"}</span>
                  </Button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  External services (ATS, forms, GitHub) can send HTTP POST to this URL to trigger this workflow.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <KeyRound className="h-3 w-3 text-slate-400" />
                    Secret Token (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setConfig({ ...config, secret: `whsec_${Math.random().toString(36).substring(2, 12)}` })
                    }
                    className="text-[10px] text-[#0d9488] font-medium hover:underline"
                  >
                    Generate Random Secret
                  </button>
                </div>
                <input
                  type="text"
                  value={config.secret || ""}
                  onChange={(e) => setConfig({ ...config, secret: e.target.value })}
                  placeholder="e.g. whsec_abc123 (passed via x-webhook-secret header)"
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-mono text-slate-700"
                />
              </div>

              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                    <Terminal className="h-3 w-3" /> Test Webhook Ingestion
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    disabled={testingTrigger}
                    onClick={handleTestWebhookTrigger}
                    className="h-7 px-3 rounded-lg bg-[#001d3d] hover:bg-[#002855] text-white text-[11px] font-semibold"
                  >
                    {testingTrigger ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Send className="h-3 w-3 mr-1" />}
                    Send Test Event
                  </Button>
                </div>

                {triggerTestResult && (
                  <div
                    className={`rounded-lg p-2.5 text-xs font-mono border ${
                      triggerTestResult.ok
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : "bg-rose-50 border-rose-200 text-rose-800"
                    }`}
                  >
                    <div className="font-semibold mb-0.5">
                      {triggerTestResult.ok ? "✓ 202 Accepted — Execution Queued" : "✕ Failed to trigger"}
                    </div>
                    <div className="text-[10px] opacity-90 truncate">{triggerTestResult.message}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {isSendWebhook && (
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#001d3d] flex items-center gap-1.5">
                  <Send className="h-4 w-4 text-[#0d9488]" />
                  Outbound Webhook Dispatch
                </span>
                <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                  Action Node
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-medium text-slate-500">Method</label>
                  <select
                    value={config.method || "POST"}
                    onChange={(e) => setConfig({ ...config, method: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold"
                  >
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-medium text-slate-500">Destination URL</label>
                  <input
                    type="url"
                    value={config.url || ""}
                    onChange={(e) => setConfig({ ...config, url: e.target.value })}
                    placeholder="https://hooks.slack.com/services/..."
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-medium text-slate-500 block mb-1">
                  JSON Payload (supports <code className="text-[9px]">{"{{variables}}"}</code>)
                </label>
                <textarea
                  rows={3}
                  value={config.bodyJson || ""}
                  onChange={(e) => setConfig({ ...config, bodyJson: e.target.value })}
                  placeholder='{\n  "event": "candidate_status_changed",\n  "candidate_name": "{{candidate.name}}"\n}'
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 font-mono text-[11px] leading-tight focus:border-[#0d9488] focus:outline-hidden"
                />
              </div>

              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-slate-600">Test Dispatch</span>
                  <Button
                    type="button"
                    size="sm"
                    disabled={testingDispatch || !config.url}
                    onClick={handleTestWebhookDispatch}
                    className="h-7 px-3 rounded-lg bg-[#001d3d] hover:bg-[#002855] text-white text-[11px] font-semibold disabled:opacity-50"
                  >
                    {testingDispatch ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Send className="h-3 w-3 mr-1" />}
                    Send Test Webhook
                  </Button>
                </div>

                {dispatchTestResult && (
                  <div
                    className={`rounded-lg p-2.5 text-xs font-mono border ${
                      dispatchTestResult.ok
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : "bg-rose-50 border-rose-200 text-rose-800"
                    }`}
                  >
                    <div className="font-semibold mb-0.5">
                      {dispatchTestResult.ok
                        ? `✓ ${dispatchTestResult.status} ${dispatchTestResult.statusText || "OK"}`
                        : "✕ Dispatch Failed"}
                      <span className="text-[10px] opacity-75 font-normal ml-2">
                        ({dispatchTestResult.durationMs}ms)
                      </span>
                    </div>
                    {dispatchTestResult.body && (
                      <div className="text-[10px] opacity-90 truncate max-h-12 overflow-hidden">
                        {dispatchTestResult.body}
                      </div>
                    )}
                    {dispatchTestResult.error && (
                      <div className="text-[10px] text-rose-700">{dispatchTestResult.error}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
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
                  value={config.collection || "{{sheet_rows}}"}
                  onChange={(e) =>
                    setConfig({ ...config, collection: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-[#001d3d]"
                >
                  <option value="{{sheet_rows}}">
                    Sheet rows ({"{{sheet_rows}}"} / {"{{item}}"})
                  </option>
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

          {isGoogleSheet && (
            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#001d3d]">
                <Table2 className="h-3.5 w-3.5 text-[#0d9488]" />
                Google Sheet source
              </div>
              <div>
                <label className="text-[10px] font-medium text-slate-500">
                  Spreadsheet URL or ID
                </label>
                <input
                  type="text"
                  value={config.spreadsheetId || config.spreadsheetUrl || ""}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      spreadsheetId: e.target.value,
                      spreadsheetUrl: e.target.value,
                    })
                  }
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-medium text-slate-500">
                    Tab name
                  </label>
                  <input
                    type="text"
                    value={config.sheetName || "Sheet1"}
                    onChange={(e) =>
                      setConfig({ ...config, sheetName: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-slate-500">
                    Email column
                  </label>
                  <input
                    type="text"
                    value={config.emailColumn || "email"}
                    onChange={(e) =>
                      setConfig({ ...config, emailColumn: e.target.value })
                    }
                    placeholder="email or A"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-slate-500">
                    Name column (optional)
                  </label>
                  <input
                    type="text"
                    value={config.nameColumn || "name"}
                    onChange={(e) =>
                      setConfig({ ...config, nameColumn: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-slate-500">
                    Drive file column (per-row PDFs)
                  </label>
                  <input
                    type="text"
                    value={config.driveFileColumn || ""}
                    onChange={(e) =>
                      setConfig({ ...config, driveFileColumn: e.target.value })
                    }
                    placeholder="offer_pdf_url"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={sheetPreviewLoading}
                onClick={() => handleSheetPreview({ resolveFiles: true })}
                className="text-xs"
              >
                {sheetPreviewLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                ) : (
                  <Table2 className="h-3.5 w-3.5 mr-1" />
                )}
                Fetch &amp; preview rows
              </Button>
              {sheetPreviewError && (
                <p className="text-[11px] text-red-600">{sheetPreviewError}</p>
              )}
              {sheetHeaders.length > 0 && (
                <p className="text-[10px] text-slate-500">
                  Headers: {sheetHeaders.join(", ")}
                </p>
              )}
              {sheetPreviewRows.length > 0 && (
                <div className="max-h-40 overflow-auto rounded-lg border border-slate-200 bg-white">
                  <table className="w-full text-[10px] text-left">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-2 py-1">Row</th>
                        <th className="px-2 py-1">Email</th>
                        <th className="px-2 py-1">Name</th>
                        <th className="px-2 py-1">Attachment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sheetPreviewRows.map((r) => (
                        <tr key={r.rowIndex} className="border-t border-slate-100">
                          <td className="px-2 py-1">{r.rowIndex}</td>
                          <td className="px-2 py-1">{r.email || "—"}</td>
                          <td className="px-2 py-1">{r.name || "—"}</td>
                          <td className="px-2 py-1">
                            {r.attachmentName || r.driveFileId || r.attachmentStatus || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {isEmail && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Delivery mode
                </label>
                <select
                  value={config.deliveryMode || "draft"}
                  onChange={(e) =>
                    setConfig({ ...config, deliveryMode: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-[#001d3d]"
                >
                  <option value="draft">Gmail draft (safe default)</option>
                  <option value="send">Send immediately</option>
                </select>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2.5">
                <label className="text-xs font-semibold text-[#001d3d] block">
                  PDF attachment mode
                </label>
                <div className="flex flex-col gap-1.5">
                  <label className="flex items-start gap-2 text-[11px] text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="attachmentMode"
                      className="mt-0.5"
                      checked={(config.attachmentMode || "shared") === "shared"}
                      onChange={() =>
                        setConfig({ ...config, attachmentMode: "shared" })
                      }
                    />
                    <span>
                      <strong>One PDF for everyone</strong> — assignments / same packet
                    </span>
                  </label>
                  <label className="flex items-start gap-2 text-[11px] text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="attachmentMode"
                      className="mt-0.5"
                      checked={config.attachmentMode === "per_row"}
                      onChange={() =>
                        setConfig({ ...config, attachmentMode: "per_row" })
                      }
                    />
                    <span>
                      <strong>Different PDF per row</strong> — offer letter from Sheet Drive column
                    </span>
                  </label>
                </div>

                {(config.attachmentMode || "shared") === "shared" ? (
                  <div className="space-y-2 pt-1">
                    <label className="text-[10px] font-medium text-slate-500">
                      Shared Drive file ID / URL
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={config.sharedDriveFileId || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            sharedDriveFileId: e.target.value,
                          })
                        }
                        placeholder="Drive link or file id"
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResolveSharedFile}
                        className="text-[10px] shrink-0"
                      >
                        Verify
                      </Button>
                    </div>
                    <label className="flex items-center gap-1.5 text-[11px] text-[#0d9488] cursor-pointer">
                      <FileUp className="h-3.5 w-3.5" />
                      {uploadingPdf ? "Uploading…" : "Or upload a PDF to Drive"}
                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        className="hidden"
                        disabled={!integrationId || uploadingPdf}
                        onChange={(e) =>
                          handleUploadSharedPdf(e.target.files?.[0] || null)
                        }
                      />
                    </label>
                    {(sharedFileLabel || config.sharedDriveFileName) && (
                      <p className="text-[10px] text-slate-600">
                        File: {sharedFileLabel || config.sharedDriveFileName}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    <label className="text-[10px] font-medium text-slate-500">
                      Sheet column with Drive link / file ID
                    </label>
                    <input
                      type="text"
                      value={config.driveFileColumn || "offer_pdf_url"}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          driveFileColumn: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                    />
                    <p className="text-[10px] text-slate-500">
                      Use with Read Google Sheet → For Each. Preview attachments from the Sheet node.
                    </p>
                  </div>
                )}
              </div>

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
                  value={config.recipient || config.to || "{{item.email}}"}
                  onFocus={() => setActiveField("recipient")}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      recipient: e.target.value,
                      to: e.target.value,
                    })
                  }
                  placeholder="e.g. {{item.email}} or candidate@company.com"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-[#001d3d] focus:ring-2 focus:ring-[#14b8a6]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={
                    config.subject || "Your document from {{company.name}}"
                  }
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
                    "Hi {{item.name}},\n\nPlease find your document attached.\n\nBest regards,\nHR Operations"
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
