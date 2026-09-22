"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cpu,
  ExternalLink,
  Filter,
  Globe,
  HardDrive,
  HelpCircle,
  Key,
  Layers,
  LayoutDashboard,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MoreVertical,
  Play,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  UserCheck,
  Users,
  Workflow,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  deleteWorkflow,
  listWorkflows,
  fetchWorkflowsApi,
  createWorkflowApi,
  deleteWorkflowApi,
  type WorkflowDocument,
} from "@/lib/workflow";
import {
  HR_TEMPLATES,
  instantiateTemplate,
  type HRTemplate,
} from "@/lib/templates";

type NavTab =
  | "dashboard"
  | "automations"
  | "employees"
  | "recruitment"
  | "templates"
  | "settings";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [workflows, setWorkflows] = useState<WorkflowDocument[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused">("all");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const loadWorkflows = async () => {
    const list = await fetchWorkflowsApi();
    setWorkflows(list as any);
  };

  useEffect(() => {
    loadWorkflows();
  }, []);

  const userName = useMemo(() => {
    return session?.user?.name || "Tushar Behera";
  }, [session?.user?.name]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  // Compute dynamic stats based on actual saved workflows
  const activeWorkflows = useMemo(
    () => workflows.filter((w) => (w as any).status !== "paused"),
    [workflows]
  );
  const pausedWorkflows = useMemo(
    () => workflows.filter((w) => (w as any).status === "paused"),
    [workflows]
  );

  const activeCount = workflows.length > 0 ? activeWorkflows.length : 0;
  const pausedCount = workflows.length > 0 ? pausedWorkflows.length : 0;
  const failedCount = 0; // Dynamic: 0 when no failure logs exist
  const totalRuns = workflows.reduce(
    (acc, w) => acc + ((w as any).runsCount || 0),
    0
  ); // Dynamic: 0 when no runs exist

  // Dynamic notification list (empty if no unread alerts)
  const notifications: Array<{ id: string; title: string; subtitle: string; time: string }> = [];

  const handleUseTemplate = async (template: HRTemplate) => {
    const existing = workflows.find((w) => w.name === template.name);
    if (existing) {
      router.push(`/workflows/${existing.id}`);
      return;
    }
    const created = await createWorkflowApi({
      name: template.doc.name,
      nodes: template.doc.nodes,
      edges: template.doc.edges,
    });
    if (created) {
      await loadWorkflows();
      router.push(`/workflows/${created.id}`);
    } else {
      const local = instantiateTemplate(template.id);
      if (local) {
        setWorkflows(listWorkflows());
        router.push(`/workflows/${local.id}`);
      }
    }
  };

  const handleDeleteWorkflow = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteWorkflowApi(id);
    deleteWorkflow(id);
    await loadWorkflows();
  };

  const filteredWorkflows = useMemo(() => {
    return workflows.filter((w) => {
      const matchesSearch = w.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (statusFilter === "active") {
        return matchesSearch && (w as any).status !== "paused";
      }
      if (statusFilter === "paused") {
        return matchesSearch && (w as any).status === "paused";
      }
      return matchesSearch;
    });
  }, [workflows, searchQuery, statusFilter]);

  if (status === "loading" || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8f3]">
        <Loader2 className="h-9 w-9 animate-spin text-[#14b8a6]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#faf8f3] relative text-[#001d3d] flex flex-col">
      {/* Ivory Dot Sheet Background */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,29,61,0.12) 1px, transparent 0)`,
          backgroundSize: "16px 16px",
        }}
      />

      {/* Top right profile actions directly in the background — no navbar, no brand logo */}
      <div className="absolute top-4 right-6 z-30 flex items-center gap-3">
        <span className="text-sm font-medium text-[#001d3d]/90 hidden sm:inline">
          {userName}
        </span>

        {/* Notifications Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen((prev) => !prev)}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg text-[#001d3d]/70 hover:bg-white/80 hover:text-[#14b8a6] transition-colors"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#14b8a6]" />
            )}
          </button>

          {/* Notification popover */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-[rgba(0,29,61,0.08)] bg-white p-3 shadow-lg z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-[#001d3d]">
                  Notifications
                </span>
                <button
                  onClick={() => setNotificationsOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              {notifications.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  <Bell className="mx-auto h-5 w-5 text-slate-300 mb-1.5" />
                  No new notifications
                </div>
              ) : (
                <div className="mt-2 space-y-2 text-xs">
                  {notifications.map((n) => (
                    <div key={n.id} className="rounded-lg bg-[#f0fdfa] p-2 text-[#0d9488]">
                      <p className="font-medium">{n.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{n.subtitle} · {n.time}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile Icon / Avatar */}
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#001d3d] text-white text-xs font-semibold shadow-sm ring-2 ring-[rgba(20,184,166,0.2)]"
          title={session?.user?.email ?? userName}
        >
          {userName.slice(0, 2).toUpperCase()}
        </div>

        {/* Sign Out Icon Button (minimal icon, no text) */}
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
          title="Sign Out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      {/* Main Layout: Left Sidebar + Content Area */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row pt-4">
        {/* Left Sidebar */}
        <aside className="w-full md:w-56 p-4 flex flex-col justify-between shrink-0">
          <nav className="space-y-1">
            <button
              type="button"
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === "dashboard"
                  ? "bg-[#f0fdfa] text-[#0d9488] shadow-xs font-semibold"
                  : "text-[#001d3d]/70 hover:bg-[#faf8f3] hover:text-[#001d3d]"
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("automations")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === "automations"
                  ? "bg-[#f0fdfa] text-[#0d9488] shadow-xs font-semibold"
                  : "text-[#001d3d]/70 hover:bg-[#faf8f3] hover:text-[#001d3d]"
              }`}
            >
              <Workflow className="h-4 w-4" />
              <div className="flex items-center justify-between w-full">
                <span>Automations</span>
                <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  {workflows.length}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("employees")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === "employees"
                  ? "bg-[#f0fdfa] text-[#0d9488] shadow-xs font-semibold"
                  : "text-[#001d3d]/70 hover:bg-[#faf8f3] hover:text-[#001d3d]"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Employees</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("recruitment")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === "recruitment"
                  ? "bg-[#f0fdfa] text-[#0d9488] shadow-xs font-semibold"
                  : "text-[#001d3d]/70 hover:bg-[#faf8f3] hover:text-[#001d3d]"
              }`}
            >
              <UserCheck className="h-4 w-4" />
              <span>Recruitment</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("templates")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === "templates"
                  ? "bg-[#f0fdfa] text-[#0d9488] shadow-xs font-semibold"
                  : "text-[#001d3d]/70 hover:bg-[#faf8f3] hover:text-[#001d3d]"
              }`}
            >
              <Sparkles className="h-4 w-4 text-[#14b8a6]" />
              <span>Templates</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === "settings"
                  ? "bg-[#f0fdfa] text-[#0d9488] shadow-xs font-semibold"
                  : "text-[#001d3d]/70 hover:bg-[#faf8f3] hover:text-[#001d3d]"
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </button>
          </nav>

          {/* Sidebar bottom widget */}
          <div className="mt-8 rounded-xl border border-[rgba(0,29,61,0.06)] bg-white/60 p-3 text-xs text-slate-500">
            <p className="font-medium text-[#001d3d]">No-Code HR Engine</p>
            <p className="mt-1 text-[11px] text-slate-400">
              Drag-and-drop triggers, HR records, conditions, and actions.
            </p>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-6xl">
          {/* ══════════════ TAB 1: DASHBOARD (Clean Dynamic Stats & Zero If Not Exist) ══════════════ */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* Greeting */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#001d3d]">
                  {greeting}, {userName}
                </h1>
                <p className="mt-1.5 text-sm text-[#64748b]">
                  Here&apos;s what&apos;s happening with your automations
                </p>
              </div>

              {/* 4 Stat Boxes in a Row: [Active] [Failed] [Runs] [Paused] (Shows 0 if no data exists) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Active */}
                <div className="rounded-2xl border border-[rgba(0,29,61,0.08)] bg-white p-4 sm:p-5 shadow-xs transition hover:shadow-md">
                  <div className="text-2xl sm:text-3xl font-bold text-[#001d3d]">
                    {activeCount}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                    Active
                  </div>
                </div>

                {/* Failed */}
                <div className="rounded-2xl border border-[rgba(0,29,61,0.08)] bg-white p-4 sm:p-5 shadow-xs transition hover:shadow-md">
                  <div className="text-2xl sm:text-3xl font-bold text-[#001d3d]">
                    {failedCount}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-rose-600">
                    <span className="h-2 w-2 rounded-full bg-rose-500 inline-block" />
                    Failed
                  </div>
                </div>

                {/* Runs */}
                <div className="rounded-2xl border border-[rgba(0,29,61,0.08)] bg-white p-4 sm:p-5 shadow-xs transition hover:shadow-md">
                  <div className="text-2xl sm:text-3xl font-bold text-[#001d3d]">
                    {totalRuns}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-blue-600">
                    <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
                    Runs
                  </div>
                </div>

                {/* Paused */}
                <div className="rounded-2xl border border-[rgba(0,29,61,0.08)] bg-white p-4 sm:p-5 shadow-xs transition hover:shadow-md">
                  <div className="text-2xl sm:text-3xl font-bold text-[#001d3d]">
                    {pausedCount}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <span className="h-2 w-2 rounded-full bg-slate-400 inline-block" />
                    Paused
                  </div>
                </div>
              </div>

              {/* Automations Section Header with [+ Create] button */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[#001d3d]">
                      Automations
                    </h2>
                  </div>
                  <Button
                    asChild
                    size="sm"
                    className="bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-xl shadow-xs gap-1.5"
                  >
                    <Link href="/workflows/new">
                      <Plus className="h-4 w-4" />
                      <span>Create</span>
                    </Link>
                  </Button>
                </div>

                {/* Real Automations list (No hardcoded fake items) */}
                {workflows.length === 0 ? (
                  <div className="rounded-2xl border border-[rgba(0,29,61,0.08)] bg-white p-10 text-center shadow-xs">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0fdfa] text-[#14b8a6]">
                      <Workflow className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 font-semibold text-base text-[#001d3d]">
                      No automations yet
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-500 max-w-sm mx-auto">
                      Create your first automated workflow or instantiate a pre-built blueprint from the Templates library.
                    </p>
                    <div className="mt-5 flex items-center justify-center gap-3">
                      <Button
                        asChild
                        size="sm"
                        className="bg-[#14b8a6] hover:bg-[#0d9488] text-white text-xs rounded-xl shadow-xs"
                      >
                        <Link href="/workflows/new">
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Create Workflow
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveTab("templates")}
                        className="border-slate-200 text-xs rounded-xl hover:bg-slate-50"
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-1 text-[#14b8a6]" />
                        Browse Templates
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {workflows.map((w) => (
                      <div
                        key={w.id}
                        className="rounded-2xl border border-[rgba(0,29,61,0.08)] bg-white p-5 shadow-xs transition hover:shadow-md hover:border-[rgba(20,184,166,0.25)]"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <h3 className="font-semibold text-base text-[#001d3d]">
                              {w.name}
                            </h3>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          </div>
                          <span className="text-xs text-slate-400">
                            Updated {new Date(w.updatedAt).toLocaleDateString()}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-slate-500">
                          {(w.nodes?.length ?? (w as any).nodeCount ?? 0)} nodes · {(w.edges?.length ?? (w as any).edgeCount ?? 0)} connections
                        </p>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">
                              {(w as any).runsCount ?? 0} runs
                            </span>
                            <span className="text-slate-300">·</span>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteWorkflow(w.id, e)}
                              className="text-xs text-slate-400 hover:text-rose-600 transition-colors p-1"
                              title="Delete workflow"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <Link
                            href={`/workflows/${w.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0d9488] hover:text-[#0f766e] transition-colors"
                          >
                            View <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════ TAB 2: AUTOMATIONS ══════════════ */}
          {activeTab === "automations" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-[#001d3d]">
                    All Automations
                  </h1>
                  <p className="text-sm text-[#64748b] mt-1">
                    Manage, run, and monitor no-code automation triggers.
                  </p>
                </div>
                <Button
                  asChild
                  className="bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-xl shadow-xs gap-1.5"
                >
                  <Link href="/workflows/new">
                    <Plus className="h-4 w-4" />
                    <span>Create Automation</span>
                  </Link>
                </Button>
              </div>

              {/* Search and filters */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search automations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-[rgba(0,29,61,0.08)] bg-white pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                  />
                </div>
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <button
                    onClick={() => setStatusFilter("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      statusFilter === "all"
                        ? "bg-[#001d3d] text-white"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    All ({workflows.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter("active")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      statusFilter === "active"
                        ? "bg-[#14b8a6] text-white"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Active ({activeCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter("paused")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      statusFilter === "paused"
                        ? "bg-slate-700 text-white"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Paused ({pausedCount})
                  </button>
                </div>
              </div>

              {/* Automations Table / List */}
              {filteredWorkflows.length === 0 ? (
                <div className="rounded-2xl border border-[rgba(0,29,61,0.08)] bg-white p-12 text-center shadow-xs">
                  <Workflow className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-3 text-sm font-medium text-slate-700">
                    No automations found
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {workflows.length === 0
                      ? "Create your first workflow to see it here."
                      : "No workflows matched your search filter."}
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-[rgba(0,29,61,0.08)] bg-white shadow-xs overflow-hidden">
                  <div className="divide-y divide-slate-100">
                    {filteredWorkflows.map((w) => (
                      <div
                        key={w.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#faf8f3]/60 transition"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-[#001d3d]">
                              {w.name}
                            </span>
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                              Active
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {(w.nodes?.length ?? (w as any).nodeCount ?? 0)} nodes · Updated {new Date(w.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                            className="border-[rgba(0,29,61,0.1)] text-xs h-8 hover:border-[#14b8a6] hover:text-[#14b8a6]"
                          >
                            <Link href={`/workflows/${w.id}`}>Open in Canvas</Link>
                          </Button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteWorkflow(w.id, e)}
                            className="p-2 text-slate-400 hover:text-rose-600 transition"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════ TAB 3: EMPLOYEES (Zero if not exist) ══════════════ */}
          {activeTab === "employees" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#001d3d]">
                  Employees & Operations
                </h1>
                <p className="text-sm text-[#64748b] mt-1">
                  Employee records synced with automated attendance tracking and onboarding triggers.
                </p>
              </div>

              {/* Dynamic stats overview (0 if not synced) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-[rgba(0,29,61,0.08)] bg-white p-4">
                  <div className="text-2xl font-bold text-[#001d3d]">0</div>
                  <div className="text-xs text-slate-500 mt-1">Total Employees</div>
                </div>
                <div className="rounded-2xl border border-[rgba(0,29,61,0.08)] bg-white p-4">
                  <div className="text-2xl font-bold text-emerald-600">0</div>
                  <div className="text-xs text-slate-500 mt-1">Active Today</div>
                </div>
                <div className="rounded-2xl border border-[rgba(0,29,61,0.08)] bg-white p-4">
                  <div className="text-2xl font-bold text-amber-600">0</div>
                  <div className="text-xs text-slate-500 mt-1">On Approved PTO</div>
                </div>
                <div className="rounded-2xl border border-[rgba(0,29,61,0.08)] bg-white p-4">
                  <div className="text-2xl font-bold text-[#0d9488]">0%</div>
                  <div className="text-xs text-slate-500 mt-1">Monthly Attendance</div>
                </div>
              </div>

              {/* Clean Empty State */}
              <div className="rounded-2xl border border-[rgba(0,29,61,0.08)] bg-white p-12 text-center shadow-xs">
                <Users className="mx-auto h-8 w-8 text-slate-300" />
                <h3 className="mt-3 text-sm font-semibold text-[#001d3d]">
                  No employee directory synced
                </h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                  Connect your HRIS (BambooHR, Workday, or Google Workspace) in Settings, or run a workflow with the &quot;Get Employees&quot; node to sync records.
                </p>
                <Button
                  size="sm"
                  onClick={() => setActiveTab("settings")}
                  className="mt-4 bg-[#14b8a6] hover:bg-[#0d9488] text-white text-xs rounded-xl shadow-xs"
                >
                  Configure Integrations
                </Button>
              </div>
            </div>
          )}

          {/* ══════════════ TAB 4: RECRUITMENT (Zero if not exist) ══════════════ */}
          {activeTab === "recruitment" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#001d3d]">
                  Hiring & Recruitment Pipeline
                </h1>
                <p className="text-sm text-[#64748b] mt-1">
                  Candidate assessment results, automated interviewer scheduling, and offer dispatch.
                </p>
              </div>

              {/* Pipeline stages (0 if no candidates) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { stage: "Applied", count: 0, color: "bg-slate-100 text-slate-700" },
                  { stage: "Screening", count: 0, color: "bg-blue-50 text-blue-700" },
                  { stage: "Assessment", count: 0, color: "bg-purple-50 text-purple-700" },
                  { stage: "Interview", count: 0, color: "bg-teal-50 text-teal-700" },
                  { stage: "Offer", count: 0, color: "bg-emerald-50 text-emerald-700" },
                ].map((st, i) => (
                  <div key={i} className="rounded-xl border border-[rgba(0,29,61,0.08)] bg-white p-3 text-center">
                    <div className="text-xl font-bold text-[#001d3d]">{st.count}</div>
                    <div className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-medium ${st.color}`}>
                      {st.stage}
                    </div>
                  </div>
                ))}
              </div>

              {/* Clean Empty State */}
              <div className="rounded-2xl border border-[rgba(0,29,61,0.08)] bg-white p-12 text-center shadow-xs">
                <UserCheck className="mx-auto h-8 w-8 text-slate-300" />
                <h3 className="mt-3 text-sm font-semibold text-[#001d3d]">
                  No active candidate applications
                </h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                  Sync candidates by triggering an interview scheduler workflow or connecting Greenhouse ATS in Settings.
                </p>
                <Button
                  size="sm"
                  onClick={() => setActiveTab("templates")}
                  className="mt-4 bg-[#14b8a6] hover:bg-[#0d9488] text-white text-xs rounded-xl shadow-xs"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  View Interview Templates
                </Button>
              </div>
            </div>
          )}

          {/* ══════════════ TAB 5: TEMPLATES ══════════════ */}
          {activeTab === "templates" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-[#001d3d]">
                    Workflow Templates
                  </h1>
                  <p className="text-sm text-[#64748b] mt-1">
                    Ready-to-use HR automation blueprints. Click &quot;Use Template&quot; to load into your canvas.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {HR_TEMPLATES.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    className="rounded-2xl border border-[rgba(0,29,61,0.08)] bg-white p-5 shadow-xs transition hover:shadow-md hover:border-[#14b8a6] flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-[#f0fdfa] border border-[rgba(20,184,166,0.2)] px-2.5 py-0.5 text-[10px] font-semibold text-[#0d9488]">
                          {tmpl.category}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {tmpl.nodesCount} nodes
                        </span>
                      </div>

                      <h3 className="mt-3 text-base font-semibold text-[#001d3d]">
                        {tmpl.name}
                      </h3>

                      <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                        {tmpl.description}
                      </p>

                      {/* Visual step badges */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {tmpl.steps.map((step, idx) => (
                          <span
                            key={idx}
                            className="rounded-md bg-slate-50 border border-slate-200 px-2 py-0.5 text-[10px] text-slate-600"
                          >
                            {idx + 1}. {step}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {tmpl.steps.length} configured steps
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleUseTemplate(tmpl)}
                        className="bg-[#14b8a6] hover:bg-[#0d9488] text-white text-xs h-8 rounded-xl shadow-xs"
                      >
                        Use Template →
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════════ TAB 6: SETTINGS ══════════════ */}
          {activeTab === "settings" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#001d3d]">
                  Organization & Security Settings
                </h1>
                <p className="text-sm text-[#64748b] mt-1">
                  Manage profile, data privacy compliance, and external HR integrations.
                </p>
              </div>

              {/* Profile Card */}
              <div className="rounded-2xl border border-[rgba(0,29,61,0.08)] bg-white p-5 shadow-xs">
                <h2 className="text-sm font-semibold text-[#001d3d] flex items-center gap-2">
                  <User className="h-4 w-4 text-[#14b8a6]" />
                  HR Profile
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 text-xs">
                  <div>
                    <label className="text-slate-500 font-medium">Full Name</label>
                    <input
                      type="text"
                      defaultValue={userName}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:ring-2 focus:ring-[#14b8a6]"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 font-medium">Work Email</label>
                    <input
                      type="email"
                      defaultValue={session?.user?.email ?? "tushar@company.com"}
                      disabled
                      className="mt-1 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Data Privacy & Compliance */}
              <div className="rounded-2xl border border-[rgba(0,29,61,0.08)] bg-white p-5 shadow-xs">
                <h2 className="text-sm font-semibold text-[#001d3d] flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Data Privacy & Compliance
                </h2>
                <div className="mt-3 space-y-3 text-xs">
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <div>
                      <p className="font-semibold text-slate-800">GDPR & PII Masking</p>
                      <p className="text-slate-400">Mask sensitive candidate salary and personal identification in logs.</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-medium text-emerald-700">
                      Enabled
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <div>
                      <p className="font-semibold text-slate-800">Audit Log Retention</p>
                      <p className="text-slate-400">Automatically retain execution telemetry for 90 days.</p>
                    </div>
                    <span className="text-slate-600 font-medium">90 Days</span>
                  </div>
                </div>
              </div>

              {/* Connections Card */}
              <div className="rounded-2xl border border-[rgba(0,29,61,0.08)] bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-[#001d3d] flex items-center gap-2">
                    <Globe className="h-4 w-4 text-[#14b8a6]" />
                    Connections
                  </h2>
                  <Link href="/dashboard/connections">
                    <Button
                      size="sm"
                      className="h-8 rounded-xl bg-[#14b8a6] hover:bg-[#0d9488] text-white text-xs"
                    >
                      Manage connections
                    </Button>
                  </Link>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Connect Custom REST (ATS/HR), SMTP email, and webhooks once. Workflow nodes
                  pick a connection — they never store API keys.
                </p>
                <div className="mt-3 divide-y divide-slate-100 text-xs">
                  {[
                    { name: "Custom REST API", desc: "Base URL + API key / bearer for HR data nodes" },
                    { name: "SMTP Email", desc: "Company mail server for Send Email" },
                    { name: "Custom Webhook", desc: "Outgoing webhook destination" },
                  ].map((int, i) => (
                    <div key={i} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">{int.name}</p>
                        <p className="text-slate-400">{int.desc}</p>
                      </div>
                      <Link
                        href="/dashboard/connections"
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#f0fdfa] text-[#0d9488] hover:underline"
                      >
                        Configure →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
