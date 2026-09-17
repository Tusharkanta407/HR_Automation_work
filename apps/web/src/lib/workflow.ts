import {
  Zap, Clock, Link, ClipboardCheck, PartyPopper,
  Users, User, ClipboardList, CalendarCheck, CalendarOff,
  FileText, FileSearch, BarChart3, Mic, CalendarClock,
  GitBranch, Filter, RefreshCw, GitMerge, Merge,
  Mail, Globe, Radio, UserPen, FileEdit,
  UserPlus, CalendarPlus, UserRoundPlus, ListChecks,
  Timer, FileOutput, CircleCheck,
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
  | "SUCCESS";

// ── Categories ──────────────────────────────────────────────

export type NodeCategory = "TRIGGERS" | "HR_DATA" | "LOGIC" | "ACTIONS" | "UTILITY";

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
  { type: "CONDITION", label: "Condition / IF", description: "Branch based on a condition", category: "LOGIC", icon: GitBranch },
  { type: "FILTER", label: "Filter", description: "Keep items matching criteria", category: "LOGIC", icon: Filter },
  { type: "TRANSFORM_DATA", label: "Transform Data", description: "Map or reshape data", category: "LOGIC", icon: RefreshCw },
  { type: "SWITCH", label: "Switch", description: "Route to multiple branches", category: "LOGIC", icon: GitMerge },
  { type: "MERGE", label: "Merge", description: "Combine multiple inputs", category: "LOGIC", icon: Merge },

  // ── Actions ──
  { type: "SEND_EMAIL", label: "Send Email", description: "Send a notification email", category: "ACTIONS", icon: Mail },
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

// ── Workflow document types ─────────────────────────────────

export type WorkflowNode = {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  config: Record<string, unknown>;
};

export type WorkflowEdge = {
  id: string;
  source: string;
  target: string;
};

export type WorkflowDocument = {
  id: string;
  name: string;
  updatedAt: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};

// ── LocalStorage persistence ────────────────────────────────

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
