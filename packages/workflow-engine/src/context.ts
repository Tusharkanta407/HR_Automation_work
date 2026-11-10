export type WorkflowContext = {
  sheet_rows: Array<Record<string, unknown>>;
  item: Record<string, unknown> | null;
  employees: unknown[];
  candidates: unknown[];
  company: { name: string };
  trigger: unknown;
  vars: Record<string, unknown>;
};

export function createContext(triggerInput?: unknown): WorkflowContext {
  return {
    sheet_rows: [],
    item: null,
    employees: [],
    candidates: [],
    company: { name: "Company" },
    trigger: triggerInput ?? null,
    vars: {},
  };
}

/** Replace {{path.to.value}} tokens using context (dot paths). */
export function interpolate(template: string, ctx: WorkflowContext): string {
  if (!template) return "";
  return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, rawPath: string) => {
    const path = rawPath.trim();
    const value = getPath(ctx, path);
    if (value == null) return "";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  });
}

function getPath(ctx: WorkflowContext, path: string): unknown {
  const parts = path.split(".");
  let cur: any = ctx;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}
