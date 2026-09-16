"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const ExcalidrawCanvas = dynamic(
  () =>
    import("@/components/workflow/excalidraw-canvas").then(
      (m) => m.ExcalidrawCanvas
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

export default ExcalidrawCanvas;
