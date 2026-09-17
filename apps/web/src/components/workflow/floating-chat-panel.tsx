"use client";

import { useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { AiAssistantCard } from "@/components/ui/ai-assistant-card";
import { cn } from "@/lib/utils";

type FloatingChatPanelProps = {
  open: boolean;
  onClose: () => void;
  onOpen?: () => void;
  activeNodeLabel?: string | null;
};

export default function FloatingChatPanel({
  open,
  onClose,
  onOpen,
  activeNodeLabel,
}: FloatingChatPanelProps) {
  const { data: session } = useSession();
  const [hoverTip, setHoverTip] = useState(false);

  return (
    <>
      {/* Right-side assistant FAB + hover tip */}
      {!open && (
        <div className="absolute bottom-6 right-6 z-40 flex flex-col items-end gap-2">
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
              "group flex size-[72px] items-center justify-center rounded-full",
              "bg-transparent shadow-none",
              "transition hover:scale-110",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14b8a6]/40"
            )}
            aria-label="Open HR assistant"
          >
            <Image
              src="/icons8-message-bot-100.png"
              alt="HR assistant bot"
              width={72}
              height={72}
              className="drop-shadow-md"
              priority
            />
          </button>
        </div>
      )}

      {/* Expanded assistant card */}
      {open && (
        <div className="absolute bottom-3 right-3 z-40 w-[min(100%,420px)] animate-in slide-in-from-bottom-2 fade-in duration-200">
          <AiAssistantCard
            userName={session?.user?.name}
            activeNodeLabel={activeNodeLabel}
            onClose={onClose}
            onPromptSelect={(prompt) => {
              console.info("[HR Assistant prompt]", prompt);
            }}
          />
        </div>
      )}
    </>
  );
}
