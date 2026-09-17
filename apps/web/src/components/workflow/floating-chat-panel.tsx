"use client";

import { useState } from "react";
import { Send, X, Bot, User } from "lucide-react";

type FloatingChatPanelProps = {
  open: boolean;
  onClose: () => void;
};

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hi! I'm your workflow assistant. Ask me anything about your HR automation — what nodes to use, how to connect them, or what a workflow should look like.",
  },
];

export default function FloatingChatPanel({ open, onClose }: FloatingChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
    };

    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "Thanks for your question! AI assistant integration is coming soon. For now, try dragging nodes from the palette and connecting them to build your workflow.",
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
  };

  if (!open) return null;

  return (
    <div
      className={`
        absolute bottom-3 right-3 z-40 w-80
        bg-white rounded-xl border border-[rgba(0,29,61,0.08)]
        shadow-xl overflow-hidden flex flex-col
        max-h-[480px]
        animate-in slide-in-from-bottom-2 fade-in duration-200
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(0,29,61,0.06)]">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f0fdfa]">
            <Bot className="h-4 w-4 text-[#14b8a6]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#001d3d]">AI Assistant</p>
            <p className="text-[10px] text-[#94a3b8]">Ask about your workflow</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#94a3b8] hover:bg-[#faf8f3] hover:text-[#001d3d] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                msg.role === "assistant"
                  ? "bg-[#f0fdfa]"
                  : "bg-[#f1f5f9]"
              }`}
            >
              {msg.role === "assistant" ? (
                <Bot className="h-3 w-3 text-[#14b8a6]" />
              ) : (
                <User className="h-3 w-3 text-[#64748b]" />
              )}
            </div>
            <div
              className={`rounded-xl px-3 py-2 text-[13px] leading-relaxed max-w-[85%] ${
                msg.role === "assistant"
                  ? "bg-[#faf8f3] text-[#001d3d]"
                  : "bg-[#14b8a6] text-white"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-[rgba(0,29,61,0.06)] px-3 py-3">
        <div className="flex items-center gap-2 rounded-lg bg-[#faf8f3] border border-[rgba(0,29,61,0.06)] px-3 py-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about this workflow..."
            className="flex-1 bg-transparent text-sm text-[#001d3d] placeholder:text-[#94a3b8] outline-none"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim()}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#14b8a6] text-white hover:bg-[#0d9488] disabled:opacity-40 disabled:hover:bg-[#14b8a6] transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
