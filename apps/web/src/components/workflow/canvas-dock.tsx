"use client";

import { Plus, Search, StickyNote, LayoutGrid, Sparkles } from "lucide-react";

type CanvasDockProps = {
  onOpenNodeDrawer: () => void;
  onAddStickyNote: () => void;
  onToggleChat: () => void;
};

export default function CanvasDock({
  onOpenNodeDrawer,
  onAddStickyNote,
  onToggleChat,
}: CanvasDockProps) {
  return (
    <div className="absolute left-4 top-20 z-30 flex flex-col gap-1 rounded-2xl bg-white border border-[rgba(0,29,61,0.08)] p-1.5 shadow-md backdrop-blur-md">
      {/* 1. Add Node (+) */}
      <button
        type="button"
        onClick={onOpenNodeDrawer}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 hover:bg-[#f0fdfa] hover:text-[#0d9488] transition group"
        title="Add Node"
      >
        <Plus className="h-4 w-4 group-hover:scale-110 transition-transform" />
      </button>

      {/* 2. Search Nodes */}
      <button
        type="button"
        onClick={onOpenNodeDrawer}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 hover:bg-[#f0fdfa] hover:text-[#0d9488] transition"
        title="Search Nodes"
      >
        <Search className="h-4 w-4" />
      </button>

      {/* 3. Sticky Note */}
      <button
        type="button"
        onClick={onAddStickyNote}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 hover:bg-amber-50 hover:text-amber-700 transition group"
        title="Add Sticky Note"
      >
        <StickyNote className="h-4 w-4 group-hover:rotate-6 transition-transform" />
      </button>

      {/* 4. Full Node Library */}
      <button
        type="button"
        onClick={onOpenNodeDrawer}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 hover:bg-[#f0fdfa] hover:text-[#0d9488] transition"
        title="All Nodes"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>

      {/* 5. AI Assistant */}
      <button
        type="button"
        onClick={onToggleChat}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 hover:bg-[#f0fdfa] hover:text-[#0d9488] transition"
        title="AI Assistant"
      >
        <Sparkles className="h-4 w-4 text-[#0d9488]" />
      </button>
    </div>
  );
}
