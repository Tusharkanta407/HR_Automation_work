"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  CheckCircle2,
  Globe,
  Loader2,
  Mail,
  Plus,
  Radio,
  Trash2,
  Plug,
  X,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Calendar,
  FileSpreadsheet,
  HardDrive,
  Check,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type IntegrationType = "OAUTH" | "REST_API" | "SMTP" | "WEBHOOK";

type SafeIntegration = {
  id: string;
  name: string;
  type: IntegrationType;
  provider: string;
  accountIdentifier?: string | null;
  baseUrl: string | null;
  config: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  status: string;
  createdAt: string;
  updatedAt: string;
  credentials: Array<{
    id: string;
    type: string;
    scopes?: string[];
    expiresAt?: string | null;
    hasSecret: boolean;
  }>;
};

type FormMode = "closed" | "create" | "edit";

const TYPE_META: Record<
  string,
  { label: string; description: string; icon: typeof Globe }
> = {
  OAUTH: {
    label: "Google Workspace",
    description: "Unified OAuth for Gmail, Calendar, Drive & Sheets",
    icon: Sparkles,
  },
  REST_API: {
    label: "Custom REST API",
    description: "Connect your ATS or HR system (base URL + API key / bearer)",
    icon: Globe,
  },
  SMTP: {
    label: "SMTP Email (Legacy)",
    description: "Company mail server for Send Email nodes",
    icon: Mail,
  },
  WEBHOOK: {
    label: "Custom Webhook",
    description: "Outgoing webhook destination URL",
    icon: Radio,
  },
};

function maskUrl(url: string | null): string {
  if (!url) return "—";
  try {
    const u = new URL(url.includes("://") ? url : `https://${url}`);
    return `${u.protocol}//${u.host}${u.pathname === "/" ? "" : u.pathname}`;
  } catch {
    return url.length > 48 ? `${url.slice(0, 48)}…` : url;
  }
}

export default function ConnectionsPage() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [integrations, setIntegrations] = useState<SafeIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode>("closed");
  const [selectedType, setSelectedType] = useState<IntegrationType | null>(null);
  const [editing, setEditing] = useState<SafeIntegration | null>(null);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testMsg, setTestMsg] = useState<Record<string, string>>({});

  // Form fields for Custom REST / SMTP / Webhook
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [authType, setAuthType] = useState("BEARER");
  const [apiKey, setApiKey] = useState("");
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [headersJson, setHeadersJson] = useState("");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("587");
  const [secure, setSecure] = useState(false);
  const [from, setFrom] = useState("");
  const [secret, setSecret] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (searchParams.get("success") === "google_connected") {
      setSuccessBanner(
        "Google Workspace connected successfully! Gmail, Calendar, Drive, and Sheets are now ready for your automations."
      );
    }
  }, [searchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/integrations");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setIntegrations(data.integrations || []);
    } catch (err: any) {
      setError(err.message || "Failed to load connections");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated" || status === "unauthenticated") {
      load();
    }
  }, [status, load]);

  // Identify Google Workspace connection
  const googleIntegration = useMemo(() => {
    return integrations.find(
      (i) =>
        i.provider === "GOOGLE" ||
        i.type === "OAUTH" ||
        i.name.toLowerCase().includes("google")
    );
  }, [integrations]);

  // Check granted capabilities
  const googleScopes = useMemo(() => {
    return googleIntegration?.credentials?.[0]?.scopes || [];
  }, [googleIntegration]);

  const resetForm = () => {
    setName("");
    setBaseUrl("");
    setAuthType("BEARER");
    setApiKey("");
    setToken("");
    setUsername("");
    setPassword("");
    setHeadersJson("");
    setHost("");
    setPort("587");
    setSecure(false);
    setFrom("");
    setSecret("");
    setEditing(null);
    setSelectedType(null);
    setFormMode("closed");
  };

  const openCreate = (type: IntegrationType) => {
    resetForm();
    setSelectedType(type);
    setFormMode("create");
  };

  const openEdit = (row: SafeIntegration) => {
    resetForm();
    setEditing(row);
    setSelectedType(row.type);
    setName(row.name);
    setBaseUrl(row.baseUrl || "");
    const cfg = (row.config || {}) as Record<string, any>;
    if (row.type === "SMTP") {
      setHost(String(cfg.host || ""));
      setPort(String(cfg.port || 587));
      setSecure(Boolean(cfg.secure));
      setFrom(String(cfg.from || ""));
    }
    if (cfg.headers) {
      setHeadersJson(JSON.stringify(cfg.headers, null, 2));
    }
    if (row.credentials[0]?.type) {
      setAuthType(row.credentials[0].type);
    }
    setFormMode("edit");
  };

  const handleGoogleConnect = () => {
    window.location.href = "/api/integrations/google/auth";
  };

  const handleSubmit = async () => {
    if (!selectedType) return;
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        type: selectedType,
      };

      if (selectedType === "REST_API") {
        payload.baseUrl = baseUrl.trim();
        payload.authType = authType;
        if (authType === "API_KEY" && apiKey) payload.apiKey = apiKey;
        if (authType === "BEARER" && (token || apiKey)) {
          payload.token = token || apiKey;
        }
        if (authType === "BASIC") {
          payload.username = username;
          payload.password = password;
        }
        if (headersJson.trim()) payload.headers = headersJson;
      } else if (selectedType === "SMTP") {
        payload.host = host.trim();
        payload.port = Number(port) || 587;
        payload.secure = secure;
        payload.from = from.trim();
        if (username) payload.username = username;
        if (password) payload.password = password;
      } else if (selectedType === "WEBHOOK") {
        payload.url = baseUrl.trim();
        if (secret) payload.secret = secret;
      }

      const isEdit = formMode === "edit" && editing;
      const res = await fetch(
        isEdit ? `/api/integrations/${editing!.id}` : "/api/integrations",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      resetForm();
      await load();
    } catch (err: any) {
      setError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Disconnect this service? Workflows using it will not be able to execute steps until reconnected."
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/integrations/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      await load();
    } catch (err: any) {
      setError(err.message || "Disconnect failed");
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    setTestMsg((prev) => ({ ...prev, [id]: "" }));
    try {
      const res = await fetch(`/api/integrations/${id}/test`, { method: "POST" });
      const data = await res.json();
      setTestMsg((prev) => ({
        ...prev,
        [id]: data.message || (data.success ? "Connection Verified ✓" : "Failed"),
      }));
      await load();
    } catch (err: any) {
      setTestMsg((prev) => ({
        ...prev,
        [id]: err.message || "Test failed",
      }));
    } finally {
      setTestingId(null);
    }
  };

  const customIntegrations = useMemo(
    () =>
      integrations.filter(
        (i) => i.provider !== "GOOGLE" && i.type !== "OAUTH"
      ),
    [integrations]
  );

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8f3]">
        <Loader2 className="h-6 w-6 animate-spin text-[#0d9488]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f3] text-[#001d3d]">
      {/* Header */}
      <header className="border-b border-[rgba(0,29,61,0.08)] bg-white/90 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0d9488] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
            </Link>
            <span className="text-slate-300">/</span>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f0fdfa] text-[#0d9488] border border-[#14b8a6]/20">
                <Plug className="h-4 w-4" />
              </div>
              <h1 className="text-base font-bold text-[#001d3d]">Connections</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5" /> AES-256 Encrypted
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        {/* Title & Overview */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#001d3d]">
              Connected Systems
            </h2>
            <p className="mt-1 text-sm text-slate-500 max-w-2xl">
              Connect external tools once. Workflow nodes reuse these authenticated
              connections automatically without exposing credentials in canvas configurations.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={load}
              disabled={loading}
              className="rounded-xl border-[rgba(0,29,61,0.12)] text-xs text-slate-600 hover:bg-white"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Success Banner */}
        {successBanner && (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 shadow-xs animate-in fade-in">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div className="flex-1 font-medium">{successBanner}</div>
            <button
              type="button"
              onClick={() => setSuccessBanner(null)}
              className="text-emerald-600 hover:text-emerald-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 shadow-xs">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <div className="flex-1 font-medium">{error}</div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-rose-600 hover:text-rose-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ─── FEATURED: GOOGLE WORKSPACE UNIFIED TILE ─── */}
        <section className="relative overflow-hidden rounded-3xl border border-[rgba(0,29,61,0.08)] bg-white p-6 md:p-8 shadow-sm transition-all hover:shadow-md">
          {/* Subtle gradient corner accent */}
          <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-bl from-teal-100/50 via-indigo-50/30 to-transparent pointer-events-none rounded-tr-3xl" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="flex items-start gap-4">
              {/* Google Brand Logo Icon */}
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-200/80 p-2.5">
                <svg className="h-8 w-8" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="text-lg font-bold text-[#001d3d]">
                    Google Workspace
                  </h3>
                  {googleIntegration ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      Active & Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      Not Connected
                    </span>
                  )}
                </div>

                <p className="mt-1 text-xs text-slate-500 max-w-xl">
                  {googleIntegration ? (
                    <>
                      Connected as{" "}
                      <span className="font-semibold text-[#001d3d]">
                        {googleIntegration.accountIdentifier || googleIntegration.name}
                      </span>
                      . Single secure OAuth 2.0 authorization powering candidate emails,
                      interview scheduling, document access, and spreadsheets.
                    </>
                  ) : (
                    "Authorize once to empower your HR workflows across Gmail, Google Calendar, Google Drive, and Google Sheets without storing passwords."
                  )}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center shrink-0">
              {googleIntegration ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTest(googleIntegration.id)}
                    disabled={testingId === googleIntegration.id}
                    className="rounded-xl border-slate-200 text-xs font-semibold text-[#001d3d] hover:bg-slate-50"
                  >
                    {testingId === googleIntegration.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5 text-[#0d9488]" />
                    ) : (
                      <Zap className="h-3.5 w-3.5 mr-1.5 text-[#0d9488]" />
                    )}
                    Test Connection
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGoogleConnect}
                    className="rounded-xl border-slate-200 text-xs font-semibold text-[#001d3d] hover:bg-slate-50"
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                    Reconnect / Add Scopes
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(googleIntegration.id)}
                    className="rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleGoogleConnect}
                  className="rounded-xl bg-[#001d3d] hover:bg-[#002855] text-white px-5 py-2.5 text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#fff"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#fff"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                    />
                    <path
                      fill="#fff"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#fff"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  Connect Google Workspace
                </Button>
              )}
            </div>
          </div>

          {/* Test connection result message if any */}
          {googleIntegration && testMsg[googleIntegration.id] && (
            <div className="mt-3 rounded-xl bg-[#f0fdfa] border border-[#14b8a6]/20 px-3 py-2 text-xs font-medium text-[#0d9488]">
              {testMsg[googleIntegration.id]}
            </div>
          )}

          {/* 4 Capabilities Grid (Gmail, Calendar, Drive, Sheets) */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Gmail */}
            <div className="rounded-2xl border border-slate-100 bg-[#faf8f3]/80 p-4 transition-all hover:bg-white hover:shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 relative flex items-center justify-center rounded-xl bg-white p-2 shadow-xs border border-slate-100">
                  <Image
                    src="/Gmail.png"
                    alt="Gmail"
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
                {googleIntegration ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <Check className="h-3 w-3" /> Ready
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-slate-400">Included</span>
                )}
              </div>
              <h4 className="text-xs font-bold text-[#001d3d]">Gmail</h4>
              <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                Send candidate offers, draft approval emails & inspect response threads directly.
              </p>
            </div>

            {/* 2. Calendar */}
            <div className="rounded-2xl border border-slate-100 bg-[#faf8f3]/80 p-4 transition-all hover:bg-white hover:shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 relative flex items-center justify-center rounded-xl bg-white p-2 shadow-xs border border-slate-100">
                  <Image
                    src="/Calender.png"
                    alt="Google Calendar"
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
                {googleIntegration ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <Check className="h-3 w-3" /> Ready
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-slate-400">Included</span>
                )}
              </div>
              <h4 className="text-xs font-bold text-[#001d3d]">Google Calendar</h4>
              <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                Schedule panel interviews, check interviewer availability & auto-generate Meet links.
              </p>
            </div>

            {/* 3. Google Drive */}
            <div className="rounded-2xl border border-slate-100 bg-[#faf8f3]/80 p-4 transition-all hover:bg-white hover:shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 relative flex items-center justify-center rounded-xl bg-white p-2 shadow-xs border border-slate-100">
                  <Image
                    src="/drive.png"
                    alt="Google Drive"
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
                {googleIntegration ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <Check className="h-3 w-3" /> Ready
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-slate-400">Included</span>
                )}
              </div>
              <h4 className="text-xs font-bold text-[#001d3d]">Google Drive</h4>
              <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                Fetch uploaded resumes, download company handbook PDFs & store signed agreements.
              </p>
            </div>

            {/* 4. Google Sheets */}
            <div className="rounded-2xl border border-slate-100 bg-[#faf8f3]/80 p-4 transition-all hover:bg-white hover:shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 relative flex items-center justify-center rounded-xl bg-white p-2 shadow-xs border border-slate-100">
                  <Image
                    src="/sheets.png"
                    alt="Google Sheets"
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
                {googleIntegration ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <Check className="h-3 w-3" /> Ready
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-slate-400">Included</span>
                )}
              </div>
              <h4 className="text-xs font-bold text-[#001d3d]">Google Sheets</h4>
              <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                Sync candidate pipelines, log monthly attendance rates & append employee audit records.
              </p>
            </div>
          </div>
        </section>

        {/* ─── OTHER ENTERPRISE CONNECTORS ─── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#001d3d]">
                Custom & Enterprise Integrations
              </h3>
              <p className="text-xs text-slate-500">
                Connect your internal ATS, HRIS REST APIs, webhooks, or legacy servers.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Custom REST API Card */}
            <div className="rounded-2xl border border-[rgba(0,29,61,0.08)] bg-white p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0fdfa] text-[#0d9488] border border-[#14b8a6]/20">
                    <Globe className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-semibold rounded-md bg-slate-100 text-slate-600 px-2 py-0.5">
                    REST API
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#001d3d]">Company HR / ATS API</h4>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Connect internal HR software (Base URL + Bearer token or API key) for attendance, employees, and candidate records.
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <Button
                  size="sm"
                  onClick={() => openCreate("REST_API")}
                  className="rounded-xl bg-[#001d3d] hover:bg-[#002855] text-white text-xs font-semibold"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add REST API
                </Button>
              </div>
            </div>

            {/* Webhook Card */}
            <div className="rounded-2xl border border-[rgba(0,29,61,0.08)] bg-white p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0fdfa] text-[#0d9488] border border-[#14b8a6]/20">
                    <Radio className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-semibold rounded-md bg-slate-100 text-slate-600 px-2 py-0.5">
                    Webhooks
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#001d3d]">Webhooks & Events</h4>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Send real-time JSON payloads to external endpoints or dispatch events to Slack/Zapier.
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <Button
                  size="sm"
                  onClick={() => openCreate("WEBHOOK")}
                  className="rounded-xl bg-[#001d3d] hover:bg-[#002855] text-white text-xs font-semibold"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Webhook
                </Button>
              </div>
            </div>

            {/* Microsoft 365 (Coming Soon) */}
            <div className="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-5 shadow-xs flex flex-col justify-between opacity-80">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 border border-slate-200">
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <rect fill="#F25022" x="1" y="1" width="10" height="10" />
                      <rect fill="#7FBA00" x="13" y="1" width="10" height="10" />
                      <rect fill="#00A4EF" x="1" y="13" width="10" height="10" />
                      <rect fill="#FFB900" x="13" y="13" width="10" height="10" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-semibold rounded-md bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5">
                    Coming Soon
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#001d3d]">Microsoft 365</h4>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Connect Outlook Mail, MS Teams alerts, and OneDrive for enterprise Microsoft organizations.
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-200/50">
                <span className="text-xs text-slate-400 font-medium">In Development</span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── ACTIVE CUSTOM CONNECTIONS LIST ─── */}
        <section className="rounded-2xl border border-[rgba(0,29,61,0.08)] bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-[#001d3d]">
                Configured Custom Connections ({customIntegrations.length})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Active endpoints and servers available to your workflow nodes.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openCreate("SMTP")}
                className="rounded-xl border-dashed border-slate-300 text-xs text-slate-500 hover:text-[#001d3d]"
              >
                + Add Custom SMTP
              </Button>
            </div>
          </div>

          {customIntegrations.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No custom REST APIs or webhooks configured yet. Use the cards above to add one.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {customIntegrations.map((row) => {
                const meta = TYPE_META[row.type] || TYPE_META.REST_API;
                const Icon = meta.icon;
                return (
                  <li
                    key={row.id}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0fdfa] border border-[#14b8a6]/20 text-[#0d9488]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-[#001d3d]">{row.name}</p>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                            {meta.label}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              row.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {row.status}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {row.type === "SMTP"
                            ? `Host: ${String((row.config as any)?.host || "—")}`
                            : `Target: ${maskUrl(row.baseUrl)}`}
                          {" · "}
                          Creds: {row.credentials[0]?.type || "none"}
                        </p>
                        {testMsg[row.id] && (
                          <p className="mt-1 text-xs font-medium text-[#0d9488]">
                            {testMsg[row.id]}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={testingId === row.id}
                        onClick={() => handleTest(row.id)}
                        className="rounded-xl border-slate-200 text-xs font-semibold text-[#001d3d] hover:bg-slate-50"
                      >
                        {testingId === row.id ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1 text-[#0d9488]" />
                        ) : null}
                        Test
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(row)}
                        className="rounded-xl text-xs font-semibold text-slate-600 hover:text-[#001d3d]"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(row.id)}
                        className="rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ─── ADD/EDIT MODAL FOR CUSTOM REST / SMTP / WEBHOOK ─── */}
        {formMode !== "closed" && selectedType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-lg rounded-2xl border border-[rgba(0,29,61,0.12)] bg-white p-6 shadow-xl animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-[#001d3d]">
                  {formMode === "edit" ? "Edit Connection" : `Add ${TYPE_META[selectedType]?.label}`}
                </h3>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Display Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Production ATS API"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#0d9488] focus:outline-hidden"
                  />
                </div>

                {selectedType === "REST_API" && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Base URL</label>
                      <input
                        type="url"
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        placeholder="https://api.company.com"
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#0d9488] focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Authentication</label>
                      <select
                        value={authType}
                        onChange={(e) => setAuthType(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#0d9488] focus:outline-hidden"
                      >
                        <option value="BEARER">Bearer Token</option>
                        <option value="API_KEY">API Key Header</option>
                        <option value="BASIC">Basic Auth (User / Pass)</option>
                      </select>
                    </div>
                    {authType === "BEARER" && (
                      <div>
                        <label className="text-xs font-semibold text-slate-700">Bearer Token</label>
                        <input
                          type="password"
                          value={token}
                          onChange={(e) => setToken(e.target.value)}
                          placeholder={formMode === "edit" ? "•••••• Leave blank to keep" : "ey..."}
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#0d9488] focus:outline-hidden"
                        />
                      </div>
                    )}
                    {authType === "API_KEY" && (
                      <div>
                        <label className="text-xs font-semibold text-slate-700">API Key</label>
                        <input
                          type="password"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder={formMode === "edit" ? "•••••• Leave blank to keep" : "key_..."}
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#0d9488] focus:outline-hidden"
                        />
                      </div>
                    )}
                    {authType === "BASIC" && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-semibold text-slate-700">Username</label>
                          <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#0d9488] focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-700">Password</label>
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={formMode === "edit" ? "••••••" : ""}
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#0d9488] focus:outline-hidden"
                          />
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-semibold text-slate-700">
                        Default Headers (JSON, optional)
                      </label>
                      <textarea
                        rows={2}
                        value={headersJson}
                        onChange={(e) => setHeadersJson(e.target.value)}
                        placeholder='{ "X-Custom-Header": "value" }'
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono focus:border-[#0d9488] focus:outline-hidden"
                      />
                    </div>
                  </>
                )}

                {selectedType === "SMTP" && (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="text-xs font-semibold text-slate-700">SMTP Host</label>
                        <input
                          type="text"
                          value={host}
                          onChange={(e) => setHost(e.target.value)}
                          placeholder="smtp.example.com"
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#0d9488] focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700">Port</label>
                        <input
                          type="text"
                          value={port}
                          onChange={(e) => setPort(e.target.value)}
                          placeholder="587"
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#0d9488] focus:outline-hidden"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-semibold text-slate-700">Username</label>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#0d9488] focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700">Password</label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={formMode === "edit" ? "••••••" : ""}
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#0d9488] focus:outline-hidden"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">From Address</label>
                      <input
                        type="email"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        placeholder="noreply@company.com"
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#0d9488] focus:outline-hidden"
                      />
                    </div>
                  </>
                )}

                {selectedType === "WEBHOOK" && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Destination URL</label>
                    <input
                      type="url"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="https://hooks.slack.com/services/..."
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#0d9488] focus:outline-hidden"
                    />
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetForm}
                  className="rounded-xl border-slate-200 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={saving || !name.trim()}
                  className="rounded-xl bg-[#001d3d] hover:bg-[#002855] text-white text-xs font-semibold"
                >
                  {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                  {formMode === "edit" ? "Save Changes" : "Create Connection"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
