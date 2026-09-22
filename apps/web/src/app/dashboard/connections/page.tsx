"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";

type IntegrationType = "REST_API" | "SMTP" | "WEBHOOK";

type SafeIntegration = {
  id: string;
  name: string;
  type: IntegrationType;
  provider: string;
  baseUrl: string | null;
  config: Record<string, unknown>;
  status: string;
  createdAt: string;
  updatedAt: string;
  credentials: Array<{ id: string; type: string; hasSecret: boolean }>;
};

type FormMode = "closed" | "create" | "edit";

const TYPE_META: Record<
  IntegrationType,
  { label: string; description: string; icon: typeof Globe }
> = {
  REST_API: {
    label: "Custom REST API",
    description: "Connect your ATS or HR system (base URL + API key / bearer)",
    icon: Globe,
  },
  SMTP: {
    label: "SMTP Email",
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

  const [integrations, setIntegrations] = useState<SafeIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode>("closed");
  const [selectedType, setSelectedType] = useState<IntegrationType | null>(null);
  const [editing, setEditing] = useState<SafeIntegration | null>(null);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testMsg, setTestMsg] = useState<Record<string, string>>({});

  // Form fields
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
      // dev fallback session still allows API via getSessionUser
      load();
    }
  }, [status, load]);

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

  const activeType = selectedType;

  const handleSubmit = async () => {
    if (!activeType) return;
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { name: name.trim(), type: activeType };

      if (activeType === "REST_API") {
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
      } else if (activeType === "SMTP") {
        payload.host = host.trim();
        payload.port = Number(port) || 587;
        payload.secure = secure;
        payload.from = from.trim();
        if (username) payload.username = username;
        if (password) payload.password = password;
      } else {
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
    if (!confirm("Delete this connection? Nodes using it will lose their link.")) {
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
      setError(err.message || "Delete failed");
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
        [id]: data.message || (data.success ? "OK" : "Failed"),
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

  const connected = useMemo(
    () => integrations.filter((i) => i.status !== "DISABLED"),
    [integrations]
  );

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <Loader2 className="h-6 w-6 animate-spin text-[#14b8a6]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#001d3d]">
      <header className="border-b border-[rgba(0,29,61,0.08)] bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#0d9488]"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
            </Link>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-2">
              <Plug className="h-4 w-4 text-[#14b8a6]" />
              <h1 className="text-base font-bold">Connections</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-6 py-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Connections</h2>
          <p className="mt-1 text-sm text-slate-500">
            Connect your company systems and email once. Workflow nodes reuse these
            connections — secrets stay on the server.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
            <button type="button" className="ml-auto" onClick={() => setError(null)}>
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Connected list */}
        <section className="rounded-2xl border border-[rgba(0,29,61,0.08)] bg-white p-5 shadow-xs">
          <h3 className="text-sm font-semibold">Connected</h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Reusable across workflows. Never paste API keys on individual nodes.
          </p>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-[#14b8a6]" />
            </div>
          ) : connected.length === 0 ? (
            <p className="mt-6 text-center text-xs text-slate-400 py-6">
              No connections yet. Add a Custom REST API, SMTP, or Webhook below.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {connected.map((row) => {
                const meta = TYPE_META[row.type];
                const Icon = meta.icon;
                return (
                  <li
                    key={row.id}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0fdfa] border border-[rgba(20,184,166,0.2)] text-[#0d9488]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold">{row.name}</p>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                            {meta.label}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              row.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700"
                                : row.status === "ERROR"
                                  ? "bg-rose-50 text-rose-700"
                                  : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {row.status === "ACTIVE" ? "Connected" : row.status}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-400 font-mono">
                          {row.type === "SMTP"
                            ? `${(row.config as any)?.host || "—"}:${(row.config as any)?.port || 587}`
                            : maskUrl(row.baseUrl)}
                        </p>
                        {testMsg[row.id] && (
                          <p className="mt-1 text-[11px] text-slate-500">{testMsg[row.id]}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-xl text-xs"
                        disabled={testingId === row.id}
                        onClick={() => handleTest(row.id)}
                      >
                        {testingId === row.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          "Test"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-xl text-xs"
                        onClick={() => openEdit(row)}
                      >
                        Edit
                      </Button>
                      <button
                        type="button"
                        onClick={() => handleDelete(row.id)}
                        className="rounded-xl p-2 text-rose-500 hover:bg-rose-50"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Available */}
        <section className="rounded-2xl border border-[rgba(0,29,61,0.08)] bg-white p-5 shadow-xs">
          <h3 className="text-sm font-semibold">Available connections</h3>
          <p className="mt-0.5 text-xs text-slate-400">
            V1 framework: Custom REST, SMTP, Webhook. OAuth ATS/Email providers come later.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {(Object.keys(TYPE_META) as IntegrationType[]).map((type) => {
              const meta = TYPE_META[type];
              const Icon = meta.icon;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => openCreate(type)}
                  className="flex flex-col items-start rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-left transition hover:border-[#14b8a6] hover:bg-[#f0fdfa]/40"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-slate-200 text-[#0d9488]">
                    <Plus className="h-4 w-4" />
                  </div>
                  <p className="mt-3 text-sm font-semibold flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-[#14b8a6]" />
                    {meta.label}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                    {meta.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      </main>

      {/* Create / Edit drawer */}
      {formMode !== "closed" && activeType && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#001d3d]/30 backdrop-blur-sm sm:items-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-[rgba(0,29,61,0.08)] shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold">
                  {formMode === "edit" ? "Edit connection" : `Add ${TYPE_META[activeType].label}`}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Secrets are encrypted and never sent back to the browser.
                </p>
              </div>
              <button type="button" onClick={resetForm} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Display name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Acme ATS"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:ring-2 focus:ring-[#14b8a6] outline-none"
                />
              </div>

              {activeType === "REST_API" && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Base URL
                    </label>
                    <input
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="https://hr.company.com"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:ring-2 focus:ring-[#14b8a6] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Authentication
                    </label>
                    <select
                      value={authType}
                      onChange={(e) => setAuthType(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                    >
                      <option value="BEARER">Bearer Token</option>
                      <option value="API_KEY">API Key</option>
                      <option value="BASIC">Basic (user + password)</option>
                    </select>
                  </div>
                  {authType === "BEARER" && (
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Token {formMode === "edit" && "(leave blank to keep)"}
                      </label>
                      <input
                        type="password"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                        autoComplete="off"
                      />
                    </div>
                  )}
                  {authType === "API_KEY" && (
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        API Key {formMode === "edit" && "(leave blank to keep)"}
                      </label>
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                        autoComplete="off"
                      />
                    </div>
                  )}
                  {authType === "BASIC" && (
                    <>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Username
                        </label>
                        <input
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Password {formMode === "edit" && "(leave blank to keep)"}
                        </label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                          autoComplete="off"
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Default headers JSON (optional)
                    </label>
                    <textarea
                      rows={3}
                      value={headersJson}
                      onChange={(e) => setHeadersJson(e.target.value)}
                      placeholder='{"Accept":"application/json"}'
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono"
                    />
                  </div>
                </>
              )}

              {activeType === "SMTP" && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Host
                      </label>
                      <input
                        value={host}
                        onChange={(e) => setHost(e.target.value)}
                        placeholder="smtp.company.com"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Port
                      </label>
                      <input
                        value={port}
                        onChange={(e) => setPort(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={secure}
                      onChange={(e) => setSecure(e.target.checked)}
                    />
                    Use TLS / secure
                  </label>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      From address
                    </label>
                    <input
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      placeholder="hr@company.com"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Username
                    </label>
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Password {formMode === "edit" && "(leave blank to keep)"}
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                      autoComplete="off"
                    />
                  </div>
                </>
              )}

              {activeType === "WEBHOOK" && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Target URL
                    </label>
                    <input
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="https://hooks.example.com/hr"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Optional secret {formMode === "edit" && "(leave blank to keep)"}
                    </label>
                    <input
                      type="password"
                      value={secret}
                      onChange={(e) => setSecret(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                      autoComplete="off"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
              <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={resetForm}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="rounded-xl text-xs bg-[#14b8a6] hover:bg-[#0d9488] text-white"
                disabled={saving || !name.trim()}
                onClick={handleSubmit}
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : formMode === "edit" ? (
                  "Save changes"
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Create connection
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
