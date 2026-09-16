"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { AppHeader } from "@/components/workflow/app-header";
import { NodePalette } from "@/components/workflow/node-palette";
import { NodePropertiesPanel } from "@/components/workflow/node-properties-panel";
import ExcalidrawCanvas from "@/components/workflow/excalidraw-canvas-dynamic";
import {
  getWorkflow,
  nodeLabel,
  saveWorkflow,
  type NodeType,
  type WorkflowDocument,
  type WorkflowNode,
} from "@/lib/workflow";

export default function WorkflowBuilderPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { status } = useSession();

  const [doc, setDoc] = useState<WorkflowDocument | null>(null);
  const [selected, setSelected] = useState<WorkflowNode | null>(null);
  const [saveStatus, setSaveStatus] = useState("Unsaved");
  const [runMessage, setRunMessage] = useState<string | null>(null);
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const placeIndex = useRef(0);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (!id) return;
    const existing = getWorkflow(id);
    if (!existing) {
      router.replace("/dashboard");
      return;
    }
    setDoc(existing);
    setSaveStatus("Saved");
  }, [id, router]);

  const initialData = useMemo(() => {
    if (!doc?.excalidrawElements?.length) return null;
    return {
      elements: doc.excalidrawElements as never[],
      appState: { viewBackgroundColor: "#121212" },
    };
  }, [doc?.id]); // eslint-disable-line react-hooks/exhaustive-deps -- load once per workflow id

  const handleApiReady = useCallback((api: ExcalidrawImperativeAPI) => {
    apiRef.current = api;
  }, []);

  const handleAddNode = useCallback(
    async (type: NodeType) => {
      if (!doc || !apiRef.current) return;
      const { addLabeledNodeToScene } = await import(
        "@/components/workflow/excalidraw-canvas"
      );
      const offset = (placeIndex.current % 5) * 40;
      placeIndex.current += 1;
      const nodeId = crypto.randomUUID();
      const x = 120 + offset;
      const y = 120 + offset;

      const elementId = addLabeledNodeToScene(apiRef.current, {
        id: nodeId,
        label: nodeLabel(type),
        x,
        y,
      });

      const node: WorkflowNode = {
        id: nodeId,
        type,
        position: { x, y },
        config: {},
        excalidrawElementId: elementId,
      };

      setDoc((prev) =>
        prev
          ? {
              ...prev,
              nodes: [...prev.nodes, node],
            }
          : prev
      );
      setSelected(node);
      setSaveStatus("Unsaved");
    },
    [doc]
  );

  const handleSave = useCallback(() => {
    if (!doc) return;
    const elements = apiRef.current?.getSceneElements() ?? [];
    const next: WorkflowDocument = {
      ...doc,
      excalidrawElements: structuredClone(elements) as unknown[],
      updatedAt: new Date().toISOString(),
    };
    saveWorkflow(next);
    setDoc(next);
    setSaveStatus("Saved");
  }, [doc]);

  const handleRun = useCallback(() => {
    setRunMessage("UI only — Run Now will enqueue jobs when the backend is wired.");
    window.setTimeout(() => setRunMessage(null), 4000);
  }, []);

  if (status === "loading" || !doc) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <AppHeader
        title={doc.name}
        showBuilderActions
        onSave={handleSave}
        onRun={handleRun}
        saveStatus={saveStatus}
      />
      {runMessage && (
        <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-sm text-amber-100">
          {runMessage}
        </div>
      )}
      <div className="flex min-h-0 flex-1">
        <NodePalette onAdd={handleAddNode} />
        <div className="relative min-h-0 min-w-0 flex-1">
          <ExcalidrawCanvas
            initialData={initialData}
            onApiReady={handleApiReady}
            onChange={() => setSaveStatus((s) => (s === "Saved" ? "Unsaved" : s))}
          />
        </div>
        <NodePropertiesPanel selected={selected} />
      </div>
    </div>
  );
}
