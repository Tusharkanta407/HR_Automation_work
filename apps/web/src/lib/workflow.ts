export type NodeType =
  | "MANUAL_TRIGGER"
  | "GET_MONTHLY_ATTENDANCE"
  | "FILTER"
  | "GET_EMPLOYEE_DETAILS"
  | "SEND_EMAIL"
  | "CONFIRMATION";

export type WorkflowNode = {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  config: Record<string, unknown>;
  excalidrawElementId?: string;
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
  excalidrawElements: unknown[];
};

export const NODE_CATALOG: {
  type: NodeType;
  label: string;
  description: string;
}[] = [
  {
    type: "MANUAL_TRIGGER",
    label: "Manual Trigger",
    description: "Start the workflow on demand",
  },
  {
    type: "GET_MONTHLY_ATTENDANCE",
    label: "Get Attendance",
    description: "Fetch monthly attendance from HR API",
  },
  {
    type: "FILTER",
    label: "Filter",
    description: "Keep employees below a threshold",
  },
  {
    type: "GET_EMPLOYEE_DETAILS",
    label: "Employee Details",
    description: "Enrich filtered employee ids",
  },
  {
    type: "SEND_EMAIL",
    label: "Send Email",
    description: "Mock notification email",
  },
  {
    type: "CONFIRMATION",
    label: "Confirmation",
    description: "Write a summary step",
  },
];

export function nodeLabel(type: NodeType): string {
  return NODE_CATALOG.find((n) => n.type === type)?.label ?? type;
}

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
    excalidrawElements: [],
  };
  saveWorkflow(doc);
  return doc;
}

export function deleteWorkflow(id: string): void {
  const all = listWorkflows().filter((w) => w.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}
