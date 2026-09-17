"use client";

import { useState, useMemo, type DragEvent } from "react";
import {
  Search,
  X,
  ChevronRight,
  Plus,
  StickyNote,
  type LucideIcon,
} from "lucide-react";
import {
  CATEGORIES,
  NODE_CATALOG,
  type NodeCategory,
  type NodeCatalogEntry,
  type NodeType,
} from "@/lib/workflow";

type FloatingNodePaletteProps = {
  open: boolean;
  onClose?: () => void;
  onAddNode?: (type: NodeType) => void;
  onAddStickyNote?: () => void;
};

export default function FloatingNodePalette({
  open,
  onClose,
  onAddNode,
  onAddStickyNote,
}: FloatingNodePaletteProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const filteredNodes = useMemo(() => {
    return NODE_CATALOG.filter((node) => {
      const matchesCategory =
        selectedCategory === "ALL" || node.category === selectedCategory;
      const matchesSearch =
        node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const onDragStart = (event: DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData("application/reactflow-type", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  if (!open) return null;

  return (
    <div className="absolute top-3 bottom-3 left-4 z-40 w-96 max-w-[calc(100vw-32px)] bg-white rounded-2xl border border-[rgba(0,29,61,0.08)] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-left duration-200 text-slate-800">
      {/* ── Drawer Header (n8n Style) ── */}
      <div className="p-4 pb-3 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
        <div>
          <h2 className="text-base font-bold text-[#001d3d] leading-tight">
            Add a step to workflow
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Choose a trigger or action to build your automated pipeline
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          title="Close drawer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── Search Input (n8n Style) ── */}
      <div className="p-3 pb-2 border-b border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search nodes..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#001d3d] placeholder:text-slate-400 focus:outline-none focus:border-[#14b8a6] focus:ring-2 focus:ring-[#14b8a6]/15 transition"
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory("ALL")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition ${
              selectedCategory === "ALL"
                ? "bg-[#14b8a6] text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
            }`}
          >
            All ({NODE_CATALOG.length})
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition ${
                selectedCategory === cat.key
                  ? "bg-[#14b8a6] text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Quick Sticky Note Banner ── */}
      <div className="px-3 pt-2">
        <button
          type="button"
          onClick={() => {
            onAddStickyNote?.();
            onClose?.();
          }}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 hover:bg-amber-100/70 text-amber-950 transition group"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-200/80 text-amber-900">
              <StickyNote className="h-4 w-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold leading-none">Add Sticky Note</p>
              <p className="text-[10px] text-amber-800/80 mt-1">
                Drop a documentation note right onto canvas
              </p>
            </div>
          </div>
          <Plus className="h-4 w-4 text-amber-800 group-hover:scale-110 transition" />
        </button>
      </div>

      {/* ── Node List (n8n Style with Left Accent Bar) ── */}
      <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-50">
        {filteredNodes.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="text-xs">No matching nodes found for &ldquo;{searchQuery}&rdquo;</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("ALL");
              }}
              className="mt-2 text-xs font-bold text-[#14b8a6] hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          filteredNodes.map((node) => {
            const Icon = node.icon;
            return (
              <div
                key={node.type}
                draggable
                onDragStart={(e) => onDragStart(e, node.type)}
                onClick={() => {
                  onAddNode?.(node.type);
                  onClose?.();
                }}
                className="group relative flex items-start gap-3 p-3 rounded-xl hover:bg-[#f0fdfa] cursor-pointer transition-all duration-150"
              >
                {/* n8n Style Active/Hover Left Bar */}
                <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-transparent group-hover:bg-[#14b8a6] transition-colors" />

                {/* Node Icon Box */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-[#14b8a6] group-hover:text-white transition-colors">
                  <Icon className="h-4 w-4" />
                </div>

                {/* Node Info */}
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-[#001d3d] group-hover:text-[#0d9488] transition-colors">
                      {node.label}
                    </p>
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                      {node.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">
                    {node.description}
                  </p>
                </div>

                {/* Arrow Icon */}
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#14b8a6] group-hover:translate-x-0.5 transition self-center shrink-0" />
              </div>
            );
          })
        )}
      </div>

      {/* ── Footer ── */}
      <div className="p-2.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[11px] text-slate-400 px-4">
        <span>Click or drag onto canvas</span>
        <span className="font-semibold text-[#001d3d]">
          {filteredNodes.length} nodes
        </span>
      </div>
    </div>
  );
}
