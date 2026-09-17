"use client";

import { useState } from "react";
import { Bot, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";
import { AiAssistantCard } from "@/components/ui/ai-assistant-card";
import { cn } from "@/lib/utils";

type FloatingChatPanelProps = {
  open: boolean;
  onClose: () => void;
  onOpen?: () => void;
};

export default function FloatingChatPanel({
  open,
  onClose,
  onOpen,
}: FloatingChatPanelProps) {
  const { data: session } = useSession();
  const [hoverTip, setHoverTip] = useState(false);

  return (
    <>
      {/* Right-side assistant FAB + hover tip */}
      {!open && (
        <div className="absolute bottom-4 right-4 z-40 flex flex-col items-end gap-2">
          {hoverTip && (
            <div className="max-w-[220px] rounded-xl border border-[rgba(20,184,166,0.25)] bg-white px-3 py-2 text-xs leading-relaxed text-[#001d3d] shadow-lg animate-in fade-in slide-in-from-bottom-1 duration-150">
              Hey — I can assist you with any HR flow you need.
            </div>
          )}
          <button
            type="button"
            onClick={onOpen}
            onMouseEnter={() => setHoverTip(true)}
            onMouseLeave={() => setHoverTip(false)}
            onFocus={() => setHoverTip(true)}
            onBlur={() => setHoverTip(false)}
            className={cn(
              "group flex size-12 items-center justify-center rounded-full",
              "bg-[#14b8a6] text-white shadow-lg shadow-teal-500/25",
              "transition hover:bg-[#0d9488] hover:scale-105",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14b8a6]/40"
            )}
            aria-label="Open HR assistant"
          >
            <Bot className="size-5 group-hover:hidden" />
            <Sparkles className="hidden size-5 group-hover:block" />
          </button>
        </div>
      )}

      {/* Expanded assistant card */}
      {open && (
        <div className="absolute bottom-3 right-3 z-40 w-[min(100%,420px)] animate-in slide-in-from-bottom-2 fade-in duration-200">
          <AiAssistantCard
            userName={session?.user?.name}
            onClose={onClose}
            onPromptSelect={(prompt) => {
              // UI stub — wire to real AI later
              console.info("[HR Assistant prompt]", prompt);
            }}
          />
        </div>
      )}
    </>
  );
}
