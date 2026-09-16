"use client";

import { useCallback, useRef } from "react";
import {
  Excalidraw,
  convertToExcalidrawElements,
} from "@excalidraw/excalidraw";
import type {
  ExcalidrawElementSkeleton,
} from "@excalidraw/excalidraw/data/transform";
import type {
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
} from "@excalidraw/excalidraw/types";
import "@excalidraw/excalidraw/index.css";

export type AddNodePayload = {
  id: string;
  label: string;
  x: number;
  y: number;
};

type ExcalidrawCanvasProps = {
  initialData?: ExcalidrawInitialDataState | null;
  onApiReady?: (api: ExcalidrawImperativeAPI) => void;
  onChange?: (
    elements: readonly unknown[],
    appState: unknown,
    files: unknown
  ) => void;
};

export function ExcalidrawCanvas({
  initialData,
  onApiReady,
  onChange,
}: ExcalidrawCanvasProps) {
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);

  const handleApi = useCallback(
    (api: ExcalidrawImperativeAPI) => {
      apiRef.current = api;
      onApiReady?.(api);
    },
    [onApiReady]
  );

  return (
    <div className="h-full w-full min-h-0 [&_.excalidraw]:h-full [&_.excalidraw]:w-full">
      <Excalidraw
        excalidrawAPI={handleApi}
        theme="dark"
        initialData={initialData ?? undefined}
        onChange={onChange}
        UIOptions={{
          canvasActions: {
            loadScene: false,
            export: false,
            saveToActiveFile: false,
            toggleTheme: false,
            clearCanvas: true,
          },
        }}
      />
    </div>
  );
}

/** Insert an HR-labeled rectangle via Excalidraw API */
export function addLabeledNodeToScene(
  api: ExcalidrawImperativeAPI,
  payload: AddNodePayload
) {
  const skeleton: ExcalidrawElementSkeleton[] = [
    {
      type: "rectangle",
      x: payload.x,
      y: payload.y,
      width: 220,
      height: 72,
      backgroundColor: "#1e1e2e",
      strokeColor: "#a78bfa",
      roughness: 0,
      roundness: { type: 3 },
      label: {
        text: payload.label,
        fontSize: 16,
        strokeColor: "#f5f5f5",
      },
      customData: {
        workflowNodeId: payload.id,
      },
    },
  ];

  const newElements = convertToExcalidrawElements(skeleton, {
    regenerateIds: false,
  });

  const current = api.getSceneElements();
  api.updateScene({
    elements: [...current, ...newElements],
  });

  return newElements[0]?.id as string | undefined;
}
