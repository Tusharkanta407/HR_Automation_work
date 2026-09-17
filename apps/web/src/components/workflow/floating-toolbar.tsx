"use client";

import { Button } from "@/components/ui/button";
import { signOut, useSession } from "next-auth/react";
import { LayoutGrid, MessageCircle, Play, Save } from "lucide-react";
import Link from "next/link";

type FloatingToolbarProps = {
  title?: string;
  paletteOpen: boolean;
  chatOpen: boolean;
  onTogglePalette: () => void;
  onToggleChat: () => void;
  onSave?: () => void;
  onRun?: () => void;
  saveStatus?: string;
};

export default function FloatingToolbar({
  title = "Untitled workflow",
  paletteOpen,
  chatOpen,
  onTogglePalette,
  onToggleChat,
  onSave,
  onRun,
  saveStatus,
}: FloatingToolbarProps) {
  const { data: session } = useSession();

  return (
    <div className="absolute top-3 left-3 right-3 z-50 flex items-center justify-between gap-3">
      {/* Left — toggle buttons */}
      <div className="flex items-center gap-1.5 rounded-xl bg-white/90 border border-[rgba(0,29,61,0.08)] shadow-sm backdrop-blur-md px-1.5 py-1.5">
        <button
          type="button"
          onClick={onTogglePalette}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-150 ${
            paletteOpen
              ? "bg-[#14b8a6] text-white shadow-sm"
              : "text-[#001d3d]/70 hover:bg-[#f0fdfa] hover:text-[#14b8a6]"
          }`}
          title="Node Library"
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onToggleChat}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-150 ${
            chatOpen
              ? "bg-[#14b8a6] text-white shadow-sm"
              : "text-[#001d3d]/70 hover:bg-[#f0fdfa] hover:text-[#14b8a6]"
          }`}
          title="AI Assistant"
        >
          <MessageCircle className="h-4 w-4" />
        </button>
      </div>

      {/* Center — workflow name */}
      <div className="hidden sm:flex items-center gap-2 rounded-xl bg-white/90 border border-[rgba(0,29,61,0.08)] shadow-sm backdrop-blur-md px-4 py-2">
        <Link href="/dashboard" className="text-[#001d3d]/40 hover:text-[#14b8a6] transition-colors text-xs font-medium">
          ← Dashboard
        </Link>
        <span className="text-[#001d3d]/20">|</span>
        <span className="text-sm font-semibold text-[#001d3d] truncate max-w-[200px]">
          {title}
        </span>
        {saveStatus && (
          <span className="text-[10px] text-[#94a3b8] font-medium">
            {saveStatus}
          </span>
        )}
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-1.5 rounded-xl bg-white/90 border border-[rgba(0,29,61,0.08)] shadow-sm backdrop-blur-md px-1.5 py-1.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSave}
          className="h-8 gap-1.5 text-[#001d3d]/70 hover:bg-[#f0fdfa] hover:text-[#14b8a6]"
        >
          <Save className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-xs">Save</span>
        </Button>
        <Button
          size="sm"
          onClick={onRun}
          className="h-8 gap-1.5 bg-[#14b8a6] hover:bg-[#0d9488] text-white"
        >
          <Play className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-xs">Run</span>
        </Button>
        {session?.user && (
          <div className="flex items-center gap-1 ml-1">
            <span className="hidden md:inline text-[11px] text-[#001d3d]/50 truncate max-w-[100px]">
              {session.user.name ?? session.user.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[10px] text-[#001d3d]/40 hover:text-[#001d3d]/70 px-2"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Sign out
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
