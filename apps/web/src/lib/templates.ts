import { saveWorkflow, type WorkflowDocument } from "./workflow";

export type HRTemplate = {
  id: string;
  name: string;
  category: "Employee Operations" | "Hiring & Recruitment" | "Leave & Attendance" | "Onboarding";
  description: string;
  runs: string;
  lastRun: string;
  status: "Active" | "Paused";
  nodesCount: number;
  steps: string[];
  doc: Omit<WorkflowDocument, "id" | "updatedAt">;
};

export const HR_TEMPLATES: HRTemplate[] = [
  {
    id: "template-low-attendance",
    name: "Low Attendance Alert",
    category: "Employee Operations",
    description: "Monitors attendance weekly and notifies managers when monthly attendance drops below 80%.",
    runs: "24 runs • 2 failures",
    lastRun: "12 mins ago",
    status: "Active",
    nodesCount: 4,
    steps: ["Schedule (Weekly)", "Get Monthly Attendance", "Filter (< 80%)", "Send Email Alert"],
    doc: {
      name: "Low Attendance Alert",
      nodes: [
        {
          id: "node-1",
          type: "SCHEDULE",
          position: { x: 100, y: 150 },
          config: { cron: "0 9 * * 1" },
        },
        {
          id: "node-2",
          type: "GET_MONTHLY_ATTENDANCE",
          position: { x: 380, y: 150 },
          config: { period: "last_30_days" },
        },
        {
          id: "node-3",
          type: "FILTER",
          position: { x: 660, y: 150 },
          config: { condition: "attendance_rate < 0.8" },
        },
        {
          id: "node-4",
          type: "SEND_EMAIL",
          position: { x: 940, y: 150 },
          config: { recipient: "manager@company.com", template: "attendance_warning" },
        },
      ],
      edges: [
        { id: "e1-2", source: "node-1", target: "node-2" },
        { id: "e2-3", source: "node-2", target: "node-3" },
        { id: "e3-4", source: "node-3", target: "node-4" },
      ],
    },
  },
  {
    id: "template-interview-scheduler",
    name: "Candidate Interview Scheduler",
    category: "Hiring & Recruitment",
    description: "Automatically queries interviewer availability and schedules a 45-min interview once a candidate passes screening.",
    runs: "45 runs • 0 failures",
    lastRun: "1 hour ago",
    status: "Active",
    nodesCount: 4,
    steps: ["Assessment Completed", "Get Interviewer Availability", "Schedule Interview", "Send Email"],
    doc: {
      name: "Candidate Interview Scheduler",
      nodes: [
        {
          id: "node-1",
          type: "ASSESSMENT_COMPLETED",
          position: { x: 100, y: 150 },
          config: { minScore: 75 },
        },
        {
          id: "node-2",
          type: "GET_INTERVIEWER_AVAILABILITY",
          position: { x: 380, y: 150 },
          config: { department: "Engineering" },
        },
        {
          id: "node-3",
          type: "SCHEDULE_INTERVIEW",
          position: { x: 660, y: 150 },
          config: { durationMinutes: 45 },
        },
        {
          id: "node-4",
          type: "SEND_EMAIL",
          position: { x: 940, y: 150 },
          config: { template: "candidate_invite" },
        },
      ],
      edges: [
        { id: "e1-2", source: "node-1", target: "node-2" },
        { id: "e2-3", source: "node-2", target: "node-3" },
        { id: "e3-4", source: "node-3", target: "node-4" },
      ],
    },
  },
  {
    id: "template-employee-onboarding",
    name: "New Employee Onboarding Flow",
    category: "Onboarding",
    description: "Instantly provisions employee database record, creates IT hardware onboarding tasks, and dispatches the welcome package.",
    runs: "18 runs • 1 failure",
    lastRun: "3 hours ago",
    status: "Active",
    nodesCount: 5,
    steps: ["Candidate Hired", "Create Employee", "Create Onboarding Task", "Send Email", "Success"],
    doc: {
      name: "New Employee Onboarding Flow",
      nodes: [
        {
          id: "node-1",
          type: "CANDIDATE_HIRED",
          position: { x: 80, y: 150 },
          config: {},
        },
        {
          id: "node-2",
          type: "CREATE_EMPLOYEE",
          position: { x: 340, y: 150 },
          config: { role: "New Hire" },
        },
        {
          id: "node-3",
          type: "CREATE_ONBOARDING_TASK",
          position: { x: 600, y: 150 },
          config: { checklist: "IT, HR, Compliance" },
        },
        {
          id: "node-4",
          type: "SEND_EMAIL",
          position: { x: 860, y: 150 },
          config: { template: "welcome_kit" },
        },
        {
          id: "node-5",
          type: "SUCCESS",
          position: { x: 1100, y: 150 },
          config: {},
        },
      ],
      edges: [
        { id: "e1-2", source: "node-1", target: "node-2" },
        { id: "e2-3", source: "node-2", target: "node-3" },
        { id: "e3-4", source: "node-3", target: "node-4" },
        { id: "e4-5", source: "node-4", target: "node-5" },
      ],
    },
  },
  {
    id: "template-pto-approval",
    name: "Leave & PTO Fast-Track Approval",
    category: "Leave & Attendance",
    description: "Validates leave records, checks quota balance, and sends 1-click Slack/Email approvals to reporting supervisors.",
    runs: "62 runs • 0 failures",
    lastRun: "4 hours ago",
    status: "Active",
    nodesCount: 4,
    steps: ["Webhook", "Get Leave Records", "Condition / IF", "Send Email"],
    doc: {
      name: "Leave & PTO Fast-Track Approval",
      nodes: [
        {
          id: "node-1",
          type: "WEBHOOK",
          position: { x: 100, y: 150 },
          config: { event: "leave.requested" },
        },
        {
          id: "node-2",
          type: "GET_LEAVE_RECORDS",
          position: { x: 380, y: 150 },
          config: {},
        },
        {
          id: "node-3",
          type: "CONDITION",
          position: { x: 660, y: 150 },
          config: { rule: "quota_remaining > requested_days" },
        },
        {
          id: "node-4",
          type: "SEND_EMAIL",
          position: { x: 940, y: 150 },
          config: { template: "manager_pto_review" },
        },
      ],
      edges: [
        { id: "e1-2", source: "node-1", target: "node-2" },
        { id: "e2-3", source: "node-2", target: "node-3" },
        { id: "e3-4", source: "node-3", target: "node-4" },
      ],
    },
  },
];

/** Create a new workflow from a template */
export function instantiateTemplate(templateId: string): WorkflowDocument | null {
  const template = HR_TEMPLATES.find((t) => t.id === templateId);
  if (!template) return null;

  const doc: WorkflowDocument = {
    id: crypto.randomUUID(),
    name: template.doc.name,
    updatedAt: new Date().toISOString(),
    nodes: template.doc.nodes,
    edges: template.doc.edges,
  };

  saveWorkflow(doc);
  return doc;
}
