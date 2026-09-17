"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  ArrowLeft,
  Diamond,
  FlaskConical,
  Hand,
  Lock,
  LogOut,
  Mail,
  Maximize2,
  Menu,
  MoreVertical,
  MousePointer,
  Play,
  Plus,
  Redo2,
  Repeat,
  Settings2,
  StickyNote,
  Undo2,
  Unlock,
  Users,
  X,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type NodeType } from "@/lib/workflow";

type FloatingToolbarProps = {
  title?: string;
  paletteOpen: boolean;
  chatOpen?: boolean;
  isLocked?: boolean;
  activeTool?: string;
  onToggleLock?: () => void;
  onChangeActiveTool?: (tool: string) => void;
  onTogglePalette: () => void;
  onAddStickyNote?: () => void;
  onToggleChat?: () => void;
  onSave?: () => void;
  onTest?: () => void;
  onRun?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onFitView?: () => void;
  onOpenSettings?: () => void;
  onQuickAddNode?: (type: NodeType) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  saveStatus?: string;
};

export default function FloatingToolbar({
  title = "Untitled workflow",
  paletteOpen,
  isLocked = false,
  activeTool: controlledTool,
  onToggleLock,
  onChangeActiveTool,
  onTogglePalette,
  onAddStickyNote,
  onSave,
  onTest,
  onRun,
  onUndo,
  onRedo,
  onFitView,
  onOpenSettings,
  onQuickAddNode,
  canUndo = false,
  canRedo = false,
  saveStatus = "Saved",
}: FloatingToolbarProps) {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  // Local fallback if active tool is not controlled externally
  const [localActiveTool, setLocalActiveTool] = useState<string>("select");
  const currentTool = controlledTool ?? localActiveTool;

  const handleSelectTool = (tool: string) => {
    if (onChangeActiveTool) {
      onChangeActiveTool(tool);
    } else {
      setLocalActiveTool(tool);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }
      const key = e.key.toLowerCase();
      if (key === "h") {
        handleSelectTool("hand");
      } else if (key === "v") {
        handleSelectTool("select");
      } else if (key === "n") {
        onAddStickyNote?.();
      } else if (key === "1") {
        onQuickAddNode?.("MANUAL_TRIGGER");
      } else if (key === "2") {
        onQuickAddNode?.("GET_EMPLOYEES");
      } else if (key === "3") {
        onQuickAddNode?.("CONDITION");
      } else if (key === "4") {
        onQuickAddNode?.("FOR_EACH");
      } else if (key === "5") {
        onQuickAddNode?.("SEND_EMAIL");
      } else if (key === "+") {
        onTogglePalette();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onQuickAddNode, onTogglePalette, onAddStickyNote]);

  return (
    <div className="absolute top-3 left-4 right-4 z-40 flex items-center justify-between pointer-events-none">
      {/* ── Left Island: Menu Button [ ☰ ] ── */}
      <div className="relative pointer-events-auto">
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-[rgba(0,29,61,0.08)] shadow-sm backdrop-blur-md transition-all duration-150 ${
            menuOpen
              ? "bg-[#f0fdfa] text-[#0d9488] border-[#14b8a6]/50"
              : "text-[#001d3d]/80 hover:bg-[#f0fdfa] hover:text-[#0d9488]"
          }`}
          title="Workflow Menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Menu Dropdown */}
        {menuOpen && (
          <div className="absolute top-12 left-0 w-56 rounded-2xl border border-[rgba(0,29,61,0.08)] bg-white p-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-xs">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-[#f0fdfa] hover:text-[#0d9488] transition font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onOpenSettings?.();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-[#f0fdfa] hover:text-[#0d9488] transition font-medium text-left"
            >
              <Settings2 className="h-4 w-4" />
              <span>Workflow Settings ({title})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onTest?.();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-[#f0fdfa] hover:text-[#0d9488] transition font-medium text-left"
            >
              <FlaskConical className="h-4 w-4" />
              <span>Test Simulation</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onFitView?.();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-[#f0fdfa] hover:text-[#0d9488] transition font-medium text-left"
            >
              <Maximize2 className="h-4 w-4" />
              <span>Fit to Screen</span>
            </button>
            <div className="my-1 border-t border-slate-100" />
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition font-medium text-left"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Center Island: Clean Square Boxes Tool Island in Brand Teal Theme ── */}
      <div className="pointer-events-auto flex items-center gap-1 rounded-2xl bg-white border border-[rgba(0,29,61,0.08)] shadow-[0_2px_12px_rgba(0,29,61,0.06)] backdrop-blur-md px-2 py-1.5">
        {/* Lock Tool */}
        <button
          type="button"
          onClick={onToggleLock}
          className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
            isLocked
              ? "bg-[#f0fdfa] text-[#0d9488] ring-1 ring-[#14b8a6]/40"
              : "text-slate-700 hover:bg-[#f0fdfa] hover:text-[#0d9488]"
          }`}
          title={isLocked ? "Canvas Locked" : "Canvas Unlocked"}
        >
          {isLocked ? (
            <Lock className="h-[18px] w-[18px]" />
          ) : (
            <Unlock className="h-[18px] w-[18px]" />
          )}
        </button>

        {/* Divider */}
        <span className="h-5 w-px bg-slate-200/80 mx-0.5" />

        {/* Add Node Drawer Trigger (+) */}
        <button
          type="button"
          onClick={onTogglePalette}
          className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
            paletteOpen
              ? "bg-[#14b8a6] text-white shadow-2xs"
              : "text-slate-700 hover:bg-[#f0fdfa] hover:text-[#0d9488]"
          }`}
          title="Add Node Drawer (+)"
        >
          <Plus className="h-[18px] w-[18px]" />
          <span
            className={`absolute bottom-0.5 right-1 text-[9px] font-semibold leading-none select-none ${
              paletteOpen ? "text-white/80" : "text-slate-400"
            }`}
          >
            +
          </span>
        </button>

        {/* Hand Tool (Pan Mode) */}
        <button
          type="button"
          onClick={() => handleSelectTool("hand")}
          className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
            currentTool === "hand"
              ? "bg-[#f0fdfa] text-[#0d9488] ring-1 ring-[#14b8a6]/40 font-bold"
              : "text-slate-700 hover:bg-[#f0fdfa] hover:text-[#0d9488]"
          }`}
          title="Hand (Pan tool) — H"
        >
          <Hand className="h-[18px] w-[18px]" />
          <span
            className={`absolute bottom-0.5 right-1 text-[9px] font-semibold leading-none select-none ${
              currentTool === "hand" ? "text-[#0d9488]" : "text-slate-400"
            }`}
          >
            H
          </span>
        </button>

        {/* Selection Cursor */}
        <button
          type="button"
          onClick={() => handleSelectTool("select")}
          className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
            currentTool === "select"
              ? "bg-[#f0fdfa] text-[#0d9488] ring-1 ring-[#14b8a6]/40 font-bold"
              : "text-slate-700 hover:bg-[#f0fdfa] hover:text-[#0d9488]"
          }`}
          title="Selection tool — V"
        >
          <MousePointer className="h-[18px] w-[18px]" />
          <span
            className={`absolute bottom-0.5 right-1 text-[9px] font-semibold leading-none select-none ${
              currentTool === "select" ? "text-[#0d9488]" : "text-slate-400"
            }`}
          >
            V
          </span>
        </button>

        {/* Sticky Note Tool (📄) */}
        <button
          type="button"
          onClick={onAddStickyNote}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 hover:bg-amber-50 hover:text-amber-700 transition-all"
          title="Add Sticky Note — N"
        >
          <StickyNote className="h-[18px] w-[18px]" />
          <span className="absolute bottom-0.5 right-1 text-[9px] font-semibold leading-none select-none text-slate-400">
            N
          </span>
        </button>

        {/* Quick Node: Trigger (Zap) */}
        <button
          type="button"
          onClick={() => {
            handleSelectTool("trigger");
            onQuickAddNode?.("MANUAL_TRIGGER");
          }}
          className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
            currentTool === "trigger"
              ? "bg-[#f0fdfa] text-[#0d9488] ring-1 ring-[#14b8a6]/40"
              : "text-slate-700 hover:bg-[#f0fdfa] hover:text-[#0d9488]"
          }`}
          title="Add Manual Trigger — 1"
        >
          <Zap className="h-[18px] w-[18px]" />
          <span
            className={`absolute bottom-0.5 right-1 text-[9px] font-semibold leading-none select-none ${
              currentTool === "trigger" ? "text-[#0d9488]" : "text-slate-400"
            }`}
          >
            1
          </span>
        </button>

        {/* Quick Node: Employees (Users) */}
        <button
          type="button"
          onClick={() => {
            handleSelectTool("employees");
            onQuickAddNode?.("GET_EMPLOYEES");
          }}
          className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
            currentTool === "employees"
              ? "bg-[#f0fdfa] text-[#0d9488] ring-1 ring-[#14b8a6]/40"
              : "text-slate-700 hover:bg-[#f0fdfa] hover:text-[#0d9488]"
          }`}
          title="Add Get Employees — 2"
        >
          <Users className="h-[18px] w-[18px]" />
          <span
            className={`absolute bottom-0.5 right-1 text-[9px] font-semibold leading-none select-none ${
              currentTool === "employees" ? "text-[#0d9488]" : "text-slate-400"
            }`}
          >
            2
          </span>
        </button>

        {/* Quick Node: Condition (Diamond) */}
        <button
          type="button"
          onClick={() => {
            handleSelectTool("condition");
            onQuickAddNode?.("CONDITION");
          }}
          className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
            currentTool === "condition"
              ? "bg-[#f0fdfa] text-[#0d9488] ring-1 ring-[#14b8a6]/40"
              : "text-slate-700 hover:bg-[#f0fdfa] hover:text-[#0d9488]"
          }`}
          title="Add Condition / IF Branch — 3"
        >
          <Diamond className="h-[18px] w-[18px]" />
          <span
            className={`absolute bottom-0.5 right-1 text-[9px] font-semibold leading-none select-none ${
              currentTool === "condition" ? "text-[#0d9488]" : "text-slate-400"
            }`}
          >
            3
          </span>
        </button>

        {/* Quick Node: Loop (Repeat) */}
        <button
          type="button"
          onClick={() => {
            handleSelectTool("loop");
            onQuickAddNode?.("FOR_EACH");
          }}
          className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
            currentTool === "loop"
              ? "bg-[#f0fdfa] text-[#0d9488] ring-1 ring-[#14b8a6]/40"
              : "text-slate-700 hover:bg-[#f0fdfa] hover:text-[#0d9488]"
          }`}
          title="Add For Each Loop — 4"
        >
          <Repeat className="h-[18px] w-[18px]" />
          <span
            className={`absolute bottom-0.5 right-1 text-[9px] font-semibold leading-none select-none ${
              currentTool === "loop" ? "text-[#0d9488]" : "text-slate-400"
            }`}
          >
            4
          </span>
        </button>

        {/* Quick Node: Email (Mail) */}
        <button
          type="button"
          onClick={() => {
            handleSelectTool("email");
            onQuickAddNode?.("SEND_EMAIL");
          }}
          className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
            currentTool === "email"
              ? "bg-[#f0fdfa] text-[#0d9488] ring-1 ring-[#14b8a6]/40"
              : "text-slate-700 hover:bg-[#f0fdfa] hover:text-[#0d9488]"
          }`}
          title="Add Send Email — 5"
        >
          <Mail className="h-[18px] w-[18px]" />
          <span
            className={`absolute bottom-0.5 right-1 text-[9px] font-semibold leading-none select-none ${
              currentTool === "email" ? "text-[#0d9488]" : "text-slate-400"
            }`}
          >
            5
          </span>
        </button>

        {/* Divider */}
        <span className="h-5 w-px bg-slate-200/80 mx-0.5" />

        {/* Undo */}
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 hover:bg-[#f0fdfa] hover:text-[#0d9488] disabled:opacity-30 disabled:pointer-events-none transition-all"
          title="Undo"
        >
          <Undo2 className="h-[18px] w-[18px]" />
        </button>

        {/* Redo */}
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 hover:bg-[#f0fdfa] hover:text-[#0d9488] disabled:opacity-30 disabled:pointer-events-none transition-all"
          title="Redo"
        >
          <Redo2 className="h-[18px] w-[18px]" />
        </button>

        {/* Fit Canvas */}
        <button
          type="button"
          onClick={onFitView}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 hover:bg-[#f0fdfa] hover:text-[#0d9488] transition-all"
          title="Fit Canvas"
        >
          <Maximize2 className="h-[18px] w-[18px]" />
        </button>

        {/* Divider */}
        <span className="h-5 w-px bg-slate-200/80 mx-0.5" />

        {/* More Menu [ ⋮ ] */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMoreMenuOpen((prev) => !prev)}
            className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
              moreMenuOpen
                ? "bg-[#f0fdfa] text-[#0d9488] ring-1 ring-[#14b8a6]/40"
                : "text-slate-700 hover:bg-[#f0fdfa] hover:text-[#0d9488]"
            }`}
            title="More Options"
          >
            <MoreVertical className="h-[18px] w-[18px]" />
          </button>

          {moreMenuOpen && (
            <div className="absolute top-11 right-0 w-48 rounded-2xl border border-[rgba(0,29,61,0.08)] bg-white p-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setMoreMenuOpen(false);
                  onOpenSettings?.();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-[#f0fdfa] hover:text-[#0d9488] transition font-medium text-left"
              >
                <Settings2 className="h-4 w-4" />
                <span>Rename Workflow</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMoreMenuOpen(false);
                  onTest?.();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-[#f0fdfa] hover:text-[#0d9488] transition font-medium text-left"
              >
                <FlaskConical className="h-4 w-4" />
                <span>Test Simulation</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMoreMenuOpen(false);
                  onFitView?.();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-[#f0fdfa] hover:text-[#0d9488] transition font-medium text-left"
              >
                <Maximize2 className="h-4 w-4" />
                <span>Fit Screen</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Right Island: Save Icon (/icons8-save.gif), Run Pill (Teal Theme), Profile 'T' ── */}
      <div className="pointer-events-auto flex items-center gap-2">
        {/* Save Icon Button using icons8-save.gif */}
        <button
          type="button"
          onClick={onSave}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-[rgba(0,29,61,0.08)] shadow-sm backdrop-blur-md hover:bg-slate-50 hover:border-[#14b8a6]/40 hover:scale-105 active:scale-95 transition-all"
          title={`Save Workflow (${saveStatus})`}
        >
          <Image
            src="/icons8-save.gif"
            alt="Save"
            width={24}
            height={24}
            unoptimized
            className="object-contain"
          />
        </button>

        {/* Primary Run Button in Brand Teal Color Theme */}
        <button
          type="button"
          onClick={onRun}
          className="flex h-10 items-center gap-1.5 rounded-xl bg-[#14b8a6] hover:bg-[#0d9488] text-white px-4 text-xs font-bold shadow-sm hover:scale-[1.02] active:scale-95 transition"
          title="Run Automation"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>Run</span>
        </button>

        {/* Profile Avatar Icon: Just 'T' in dark navy circle */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#001d3d] text-white font-bold text-sm shadow-sm hover:opacity-90 ring-2 ring-[rgba(20,184,166,0.2)] transition"
            title="Profile"
          >
            T
          </button>

          {/* Minimal Profile Dropdown */}
          {profileOpen && (
            <div className="absolute top-12 right-0 w-44 rounded-2xl border border-[rgba(0,29,61,0.08)] bg-white p-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 text-xs">
              <div className="px-3 py-1.5 border-b border-slate-100">
                <p className="font-bold text-[#001d3d]">Tushar</p>
                <p className="text-[10px] text-slate-400 truncate">
                  {session?.user?.email || "tushar@company.com"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full mt-1 flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition font-medium text-left"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
