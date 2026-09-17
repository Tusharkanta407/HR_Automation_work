"use client";

import { memo, useState } from "react";
import { type NodeProps, useReactFlow } from "@xyflow/react";
import { StickyNote, Trash2 } from "lucide-react";

export type StickyNoteData = {
  title?: string;
  content?: string;
  color?: "yellow" | "blue" | "green" | "purple";
};

const COLOR_MAP = {
  yellow: "bg-[#fef9c3] border-[#fde047] text-amber-950",
  blue: "bg-[#e0f2fe] border-[#bae6fd] text-sky-950",
  green: "bg-[#dcfce7] border-[#bbf7d0] text-emerald-950",
  purple: "bg-[#f3e8ff] border-[#e9d5ff] text-purple-950",
};

function StickyNoteNode({ id, data, selected }: NodeProps) {
  const noteData = (data || {}) as StickyNoteData;
  const { setNodes } = useReactFlow();

  const [title, setTitle] = useState(noteData.title || "I'm a note");
  const [content, setContent] = useState(
    noteData.content || "Click to write your note here..."
  );
  const [color, setColor] = useState<keyof typeof COLOR_MAP>(noteData.color || "yellow");

  const updateNodeData = (patch: Partial<StickyNoteData>) => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              ...patch,
            },
          };
        }
        return node;
      })
    );
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
  };

  return (
    <div
      className={`
        relative rounded-2xl border-2 p-3.5 min-w-[220px] max-w-[280px] shadow-sm
        transition-all duration-150 group cursor-default select-none
        ${COLOR_MAP[color]}
        ${selected ? "ring-2 ring-[#14b8a6] shadow-md" : "hover:shadow-md"}
      `}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-black/10">
        <div className="flex items-center gap-1.5 opacity-70">
          <StickyNote className="h-3.5 w-3.5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Note</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
          {/* Color toggles */}
          <div className="flex items-center gap-1 mr-0.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setColor("yellow");
                updateNodeData({ color: "yellow" });
              }}
              className={`h-3 w-3 rounded-full bg-[#fde047] border border-black/20 ${
                color === "yellow" ? "scale-125 ring-1 ring-black/40" : ""
              }`}
              title="Yellow"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setColor("blue");
                updateNodeData({ color: "blue" });
              }}
              className={`h-3 w-3 rounded-full bg-[#7dd3fc] border border-black/20 ${
                color === "blue" ? "scale-125 ring-1 ring-black/40" : ""
              }`}
              title="Blue"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setColor("green");
                updateNodeData({ color: "green" });
              }}
              className={`h-3 w-3 rounded-full bg-[#86efac] border border-black/20 ${
                color === "green" ? "scale-125 ring-1 ring-black/40" : ""
              }`}
              title="Green"
            />
          </div>

          <button
            type="button"
            onClick={handleDelete}
            className="p-1 rounded hover:bg-black/10 text-rose-700 transition"
            title="Delete note"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Note Content - Directly editable on click! No config dialog needed */}
      <div className="flex flex-col gap-1">
        <input
          type="text"
          value={title}
          onChange={(e) => {
            const val = e.target.value;
            setTitle(val);
            updateNodeData({ title: val });
          }}
          className="nodrag w-full bg-transparent border-none p-0 text-sm font-bold text-inherit placeholder:text-inherit/50 focus:outline-none focus:ring-0"
          placeholder="Note title..."
        />
        <textarea
          value={content}
          onChange={(e) => {
            const val = e.target.value;
            setContent(val);
            updateNodeData({ content: val });
          }}
          rows={3}
          className="nodrag w-full bg-transparent border-none p-0 text-xs leading-relaxed text-inherit placeholder:text-inherit/50 resize-none focus:outline-none focus:ring-0"
          placeholder="Click here and start typing your note..."
        />
      </div>
    </div>
  );
}

export default memo(StickyNoteNode);
