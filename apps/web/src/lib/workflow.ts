import {
  Zap, Clock, Link, ClipboardCheck, PartyPopper,
  Users, User, ClipboardList, CalendarCheck, CalendarOff,
  FileText, FileSearch, BarChart3, Mic, CalendarClock,
  GitBranch, Filter, RefreshCw, GitMerge, Merge, Repeat,
  Mail, Globe, Radio, UserPen, FileEdit,
  UserPlus, CalendarPlus, UserRoundPlus, ListChecks,
  Timer, FileOutput, CircleCheck,
  UserCheck, Code2, Webhook as WebhookIcon,
  type LucideIcon,
} from "lucide-react";

// ── Node types ──────────────────────────────────────────────

export type NodeType =
  // Triggers
  | "MANUAL_TRIGGER"
  | "SCHEDULE"
  | "WEBHOOK"
  | "ASSESSMENT_COMPLETED"
  | "CANDIDATE_HIRED"
  // HR Data
  | "GET_EMPLOYEES"
  | "GET_EMPLOYEE"
  | "GET_ATTENDANCE"
  | "GET_MONTHLY_ATTENDANCE"
  | "GET_LEAVE_RECORDS"
  | "GET_CANDIDATES"
  | "GET_CANDIDATE"
  | "GET_ASSESSMENT_RESULT"
  | "GET_INTERVIEWERS"
  | "GET_INTERVIEWER_AVAILABILITY"
  // Logic
  | "CONDITION"
  | "FILTER"
  | "FOR_EACH"
  | "TRANSFORM_DATA"
  | "SWITCH"
  | "MERGE"
  // Actions
  | "SEND_EMAIL"
  | "HTTP_REQUEST"
  | "SEND_WEBHOOK"
  | "UPDATE_EMPLOYEE"
  | "UPDATE_CANDIDATE_STATUS"
  | "ASSIGN_INTERVIEWER"
  | "SCHEDULE_INTERVIEW"
  | "CREATE_EMPLOYEE"
  | "CREATE_ONBOARDING_TASK"
  // Utility
  | "DELAY"
  | "LOG_RESULT"
  | "SUCCESS"
  // Advanced
  | "HUMAN_APPROVAL"
  | "CODE"
  | "CUSTOM_API";

// ── Categories ──────────────────────────────────────────────

export type NodeCategory =
  | "TRIGGERS"
  | "HR_DATA"
  | "LOGIC"
  | "ACTIONS"
  | "UTILITY"
  | "ADVANCED";

export type NodeCategoryMeta = {
  key: NodeCategory;
  label: string;
};

export const CATEGORIES: NodeCategoryMeta[] = [
  { key: "TRIGGERS", label: "Triggers" },
  { key: "HR_DATA", label: "HR Data" },
  { key: "LOGIC", label: "Logic" },
  { key: "ACTIONS", label: "Actions" },
  { key: "UTILITY", label: "Utility" },
  { key: "ADVANCED", label: "Advanced" },
];

// ── Node catalog entry ──────────────────────────────────────

export type NodeCatalogEntry = {
  type: NodeType;
  label: string;
  description: string;
  category: NodeCategory;
  icon: LucideIcon;
};

export const NODE_CATALOG: NodeCatalogEntry[] = [
  // ── Triggers ──
  { type: "MANUAL_TRIGGER", label: "Manual Trigger", description: "Start the workflow on demand", category: "TRIGGERS", icon: Zap },
  { type: "SCHEDULE", label: "Schedule", description: "Run on a cron schedule", category: "TRIGGERS", icon: Clock },
  { type: "WEBHOOK", label: "Webhook", description: "Triggered by an external webhook", category: "TRIGGERS", icon: Link },
  { type: "ASSESSMENT_COMPLETED", label: "Assessment Completed", description: "Fires when an assessment is done", category: "TRIGGERS", icon: ClipboardCheck },
  { type: "CANDIDATE_HIRED", label: "Candidate Hired", description: "Fires when a candidate is hired", category: "TRIGGERS", icon: PartyPopper },

  // ── HR Data ──
  { type: "GET_EMPLOYEES", label: "Get Employees", description: "Fetch all employees", category: "HR_DATA", icon: Users },
  { type: "GET_EMPLOYEE", label: "Get Employee", description: "Fetch a single employee by ID", category: "HR_DATA", icon: User },
  { type: "GET_ATTENDANCE", label: "Get Attendance", description: "Fetch attendance records", category: "HR_DATA", icon: ClipboardList },
  { type: "GET_MONTHLY_ATTENDANCE", label: "Get Monthly Attendance", description: "Fetch monthly attendance summary", category: "HR_DATA", icon: CalendarCheck },
  { type: "GET_LEAVE_RECORDS", label: "Get Leave Records", description: "Fetch leave/time-off records", category: "HR_DATA", icon: CalendarOff },
  { type: "GET_CANDIDATES", label: "Get Candidates", description: "Fetch all candidates", category: "HR_DATA", icon: FileText },
  { type: "GET_CANDIDATE", label: "Get Candidate", description: "Fetch a single candidate", category: "HR_DATA", icon: FileSearch },
  { type: "GET_ASSESSMENT_RESULT", label: "Get Assessment Result", description: "Fetch assessment scores", category: "HR_DATA", icon: BarChart3 },
  { type: "GET_INTERVIEWERS", label: "Get Interviewers", description: "Fetch interviewer list", category: "HR_DATA", icon: Mic },
  { type: "GET_INTERVIEWER_AVAILABILITY", label: "Get Interviewer Availability", description: "Check interviewer schedules", category: "HR_DATA", icon: CalendarClock },

  // ── Logic ──
  { type: "CONDITION", label: "Condition / IF", description: "Branch based on True / False conditions", category: "LOGIC", icon: GitBranch },
  { type: "FILTER", label: "Filter", description: "Filter items matching criteria (e.g., Attendance < 75%)", category: "LOGIC", icon: Filter },
  { type: "FOR_EACH", label: "For Each", description: "Iterate over employee or candidate list", category: "LOGIC", icon: Repeat },
  { type: "TRANSFORM_DATA", label: "Transform Data", description: "Map or reshape data", category: "LOGIC", icon: RefreshCw },
  { type: "SWITCH", label: "Switch", description: "Route to multiple branches", category: "LOGIC", icon: GitMerge },
  { type: "MERGE", label: "Merge", description: "Combine multiple inputs", category: "LOGIC", icon: Merge },

  // ── Actions ──
  { type: "SEND_EMAIL", label: "Send Email", description: "Send automated email with variable mapping", category: "ACTIONS", icon: Mail },
  { type: "HTTP_REQUEST", label: "HTTP Request", description: "Make an external HTTP call", category: "ACTIONS", icon: Globe },
  { type: "SEND_WEBHOOK", label: "Send Webhook", description: "POST to an external endpoint", category: "ACTIONS", icon: Radio },
  { type: "UPDATE_EMPLOYEE", label: "Update Employee", description: "Modify employee record", category: "ACTIONS", icon: UserPen },
  { type: "UPDATE_CANDIDATE_STATUS", label: "Update Candidate Status", description: "Change candidate pipeline stage", category: "ACTIONS", icon: FileEdit },
  { type: "ASSIGN_INTERVIEWER", label: "Assign Interviewer", description: "Assign an interviewer to a candidate", category: "ACTIONS", icon: UserPlus },
  { type: "SCHEDULE_INTERVIEW", label: "Schedule Interview", description: "Book an interview slot", category: "ACTIONS", icon: CalendarPlus },
  { type: "CREATE_EMPLOYEE", label: "Create Employee", description: "Add a new employee record", category: "ACTIONS", icon: UserRoundPlus },
  { type: "CREATE_ONBOARDING_TASK", label: "Create Onboarding Task", description: "Create onboarding checklist item", category: "ACTIONS", icon: ListChecks },

  // ── Utility ──
  { type: "DELAY", label: "Delay", description: "Wait for a specified duration", category: "UTILITY", icon: Timer },
  { type: "LOG_RESULT", label: "Log Result", description: "Log data to execution log", category: "UTILITY", icon: FileOutput },
  { type: "SUCCESS", label: "Success", description: "Mark workflow as successful", category: "UTILITY", icon: CircleCheck },

  // ── Advanced ──
  { type: "HUMAN_APPROVAL", label: "Human Approval", description: "Pause workflow until HR Manager approves", category: "ADVANCED", icon: UserCheck },
  { type: "CODE", label: "Custom Code", description: "Execute custom JS/TS data transformation", category: "ADVANCED", icon: Code2 },
  { type: "CUSTOM_API", label: "Custom API", description: "Call proprietary internal HR API", category: "ADVANCED", icon: WebhookIcon },
];

/** Get nodes for a specific category */
export function getNodesByCategory(category: NodeCategory): NodeCatalogEntry[] {
  return NODE_CATALOG.filter((n) => n.category === category);
}

/** Get label for a node type */
export function nodeLabel(type: NodeType): string {
  return NODE_CATALOG.find((n) => n.type === type)?.label ?? type;
}

/** Get catalog entry for a node type */
export function getNodeEntry(type: NodeType): NodeCatalogEntry | undefined {
  return NODE_CATALOG.find((n) => n.type === type);
}

/** Which Connection (Integration) type a node needs, or null if none. */
export type RequiredConnectionType = "REST_API" | "SMTP" | "WEBHOOK" | null;

const REST_NODE_TYPES = new Set<NodeType>([
  "GET_EMPLOYEES",
  "GET_EMPLOYEE",
  "GET_ATTENDANCE",
  "GET_MONTHLY_ATTENDANCE",
  "GET_LEAVE_RECORDS",
  "GET_CANDIDATES",
  "GET_CANDIDATE",
  "GET_ASSESSMENT_RESULT",
  "GET_INTERVIEWERS",
  "GET_INTERVIEWER_AVAILABILITY",
  "HTTP_REQUEST",
  "CUSTOM_API",
  "UPDATE_EMPLOYEE",
  "UPDATE_CANDIDATE_STATUS",
  "ASSIGN_INTERVIEWER",
  "SCHEDULE_INTERVIEW",
  "CREATE_EMPLOYEE",
  "CREATE_ONBOARDING_TASK",
]);

export function requiredConnectionType(
  nodeType: NodeType | string
): RequiredConnectionType {
  if (nodeType === "SEND_EMAIL") return "SMTP";
  if (nodeType === "SEND_WEBHOOK") return "WEBHOOK";
  if (REST_NODE_TYPES.has(nodeType as NodeType)) return "REST_API";
  return null;
}

export function nodeRequiresConnection(nodeType: NodeType | string): boolean {
  return requiredConnectionType(nodeType) !== null;
}

/** Sensible default path for HR_DATA / action nodes (overridable in node config). */
export function defaultPathForNodeType(nodeType: NodeType | string): string {
  const defaults: Record<string, string> = {
    GET_EMPLOYEES: "/api/employees",
    GET_EMPLOYEE: "/api/employees/{id}",
    GET_ATTENDANCE: "/api/attendance",
    GET_MONTHLY_ATTENDANCE: "/api/attendance/monthly",
    GET_LEAVE_RECORDS: "/api/leave",
    GET_CANDIDATES: "/api/candidates",
    GET_CANDIDATE: "/api/candidates/{id}",
    GET_ASSESSMENT_RESULT: "/api/assessments/{id}",
    GET_INTERVIEWERS: "/api/interviewers",
    GET_INTERVIEWER_AVAILABILITY: "/api/interviewers/availability",
    UPDATE_EMPLOYEE: "/api/employees/{id}",
    UPDATE_CANDIDATE_STATUS: "/api/candidates/{id}/status",
    ASSIGN_INTERVIEWER: "/api/interviews/assign",
    SCHEDULE_INTERVIEW: "/api/interviews",
    CREATE_EMPLOYEE: "/api/employees",
    CREATE_ONBOARDING_TASK: "/api/onboarding/tasks",
    HTTP_REQUEST: "/",
    CUSTOM_API: "/",
  };
  return defaults[nodeType] || "/";
}

// ── Workflow document types ─────────────────────────────────

export type WorkflowNode = {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  config?: Record<string, unknown>;
  status?: "needs_config" | "configured" | "running" | "failed";
  integrationId?: string | null;
};

export type WorkflowEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  label?: string;
};

export type WorkflowDocument = {
  id: string;
  name: string;
  updatedAt: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};

// ── API & Persistence ──────────────────────────────────────────

const STORAGE_KEY = "hr-automation-workflows";

export function listWorkflows(): WorkflowDocument[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as WorkflowDocument[];
  } catch {
    return [];
  }
}

export function getWorkflow(id: string): WorkflowDocument | null {
  return listWorkflows().find((w) => w.id === id) ?? null;
}

export function saveWorkflow(doc: WorkflowDocument): void {
  const all = listWorkflows().filter((w) => w.id !== doc.id);
  all.unshift({ ...doc, updatedAt: new Date().toISOString() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function createWorkflowDraft(name = "Untitled workflow"): WorkflowDocument {
  const doc: WorkflowDocument = {
    id: crypto.randomUUID(),
    name,
    updatedAt: new Date().toISOString(),
    nodes: [],
    edges: [],
  };
  saveWorkflow(doc);
  return doc;
}

export function deleteWorkflow(id: string): void {
  const all = listWorkflows().filter((w) => w.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

// ── Backend API Integration ──────────────────────────────────

export type ApiWorkflowSummary = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  updatedAt: string;
  createdAt: string;
  versionNumber: number;
  nodeCount: number;
  edgeCount: number;
};

export type ApiWorkflowDetail = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  updatedAt: string;
  versionNumber: number;
  nodes: any[];
  edges: any[];
};

export async function fetchWorkflowsApi(): Promise<ApiWorkflowSummary[]> {
  try {
    const res = await fetch("/api/workflows");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.workflows || [];
  } catch (err) {
    console.warn("[API] fetchWorkflows failed, falling back to localStorage:", err);
    return listWorkflows().map((w) => ({
      id: w.id,
      name: w.name,
      description: null,
      status: "DRAFT",
      updatedAt: w.updatedAt,
      createdAt: w.updatedAt,
      versionNumber: 1,
      nodeCount: w.nodes.length,
      edgeCount: w.edges.length,
    }));
  }
}

export async function fetchWorkflowApi(id: string): Promise<ApiWorkflowDetail | null> {
  try {
    const res = await fetch(`/api/workflows/${id}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.workflow;
  } catch (err) {
    console.warn("[API] fetchWorkflow failed, falling back to localStorage:", err);
    const local = getWorkflow(id);
    if (!local) return null;
    return {
      id: local.id,
      name: local.name,
      description: null,
      status: "DRAFT",
      updatedAt: local.updatedAt,
      versionNumber: 1,
      nodes: local.nodes.map((n) => ({
        id: n.id,
        type: "hrNode",
        position: n.position,
        data: {
          label: (n.config?.customLabel as string) || nodeLabel(n.type),
          nodeType: n.type,
          status: n.status || "configured",
          config: n.config || {},
        },
      })),
      edges: local.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        type: "smoothstep",
      })),
    };
  }
}

export async function saveWorkflowApi(
  id: string,
  payload: {
    name?: string;
    description?: string;
    status?: string;
    nodes?: any[];
    edges?: any[];
  }
): Promise<boolean> {
  try {
    const res = await fetch(`/api/workflows/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.error("[API] saveWorkflow failed:", err);
    return false;
  }
}

export async function createWorkflowApi(payload?: {
  name?: string;
  description?: string;
  nodes?: any[];
  edges?: any[];
}): Promise<ApiWorkflowDetail | null> {
  try {
    const res = await fetch("/api/workflows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.workflow;
  } catch (err) {
    console.error("[API] createWorkflow failed:", err);
    return null;
  }
}

export async function deleteWorkflowApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/workflows/${id}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch (err) {
    console.error("[API] deleteWorkflow failed:", err);
    return false;
  }
}

