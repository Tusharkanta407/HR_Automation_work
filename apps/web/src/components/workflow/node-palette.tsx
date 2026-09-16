"use client";

import {
  CalendarCheck,
  CircleCheck,
  Filter,
  Mail,
  UserRound,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { NODE_CATALOG, type NodeType } from "@/lib/workflow";
import { cn } from "@/lib/utils";

const ICONS: Record<NodeType, LucideIcon> = {
  MANUAL_TRIGGER: Zap,
  GET_MONTHLY_ATTENDANCE: CalendarCheck,
  FILTER: Filter,
  GET_EMPLOYEE_DETAILS: UserRound,
  SEND_EMAIL: Mail,
  CONFIRMATION: CircleCheck,
};

type NodePaletteProps = {
  onAdd: (type: NodeType) => void;
};

export function NodePalette({ onAdd }: NodePaletteProps) {
  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-white/10 bg-background/60 backdrop-blur-md">
      <div className="border-b border-white/10 px-3 py-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Nodes
        </p>
      </div>
      <ul className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {NODE_CATALOG.map((node) => {
          const Icon = ICONS[node.type];
          return (
            <li key={node.type}>
              <button
                type="button"
                onClick={() => onAdd(node.type)}
                className={cn(
                  "flex w-full items-start gap-2 rounded-lg border border-transparent px-2.5 py-2 text-left transition",
                  "hover:border-white/15 hover:bg-white/5"
                )}
              >
                <Icon className="mt-0.5 size-4 shrink-0 text-violet-300" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{node.label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {node.description}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
