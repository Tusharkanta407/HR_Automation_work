"use client";

import type { WorkflowNode } from "@/lib/workflow";
import { nodeLabel } from "@/lib/workflow";

type NodePropertiesPanelProps = {
  selected: WorkflowNode | null;
};

export function NodePropertiesPanel({ selected }: NodePropertiesPanelProps) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-l border-white/10 bg-background/60 backdrop-blur-md">
      <div className="border-b border-white/10 px-3 py-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Properties
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 text-sm">
        {!selected ? (
          <p className="text-muted-foreground">
            Select a node from the palette or canvas to edit its settings.
          </p>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Type</p>
              <p className="font-medium">{nodeLabel(selected.type)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Id</p>
              <p className="break-all font-mono text-xs">{selected.id}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Config</p>
              <p className="text-muted-foreground">
                Config UI comes later. For now this is a visual stub.
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
