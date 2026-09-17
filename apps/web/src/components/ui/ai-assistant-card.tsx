"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Network as ChartNetworkIcon,
  Image as ImageIcon,
  Map as MapIcon,
  PenTool as PenToolIcon,
  ScanText as ScanTextIcon,
  Sparkles as SparklesIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type AiAssistantCardProps = {
  userName?: string | null;
  activeNodeLabel?: string | null;
  onClose?: () => void;
  onPromptSelect?: (prompt: string) => void;
};

export const Component = ({
  userName,
  activeNodeLabel,
  onClose,
  onPromptSelect,
}: AiAssistantCardProps) => {
  const greetingName = userName?.split(" ")[0] || "Tushar";
  const [messages, setMessages] = useState<Array<{ sender: "user" | "bot"; text: string }>>([]);
  const [input, setInput] = useState("");

  const handlePromptClick = (text: string) => {
    onPromptSelect?.(text);
    setMessages((prev) => [
      ...prev,
      { sender: "user", text },
      {
        sender: "bot",
        text: `Here are recommendations for "${activeNodeLabel || "your HR workflow"}":\n\n• Variables available: {{candidate.name}}, {{candidate.email}}, {{employee.attendance_rate}}\n• Recommended next action: Connect a Condition node or Send Email node.\n• All parameters validated with zero errors.`,
      },
    ]);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const q = input;
    setInput("");
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: q },
      {
        sender: "bot",
        text: `Analysis for "${q}": You can configure this step with a threshold (e.g. 75%), route through the TRUE / FALSE branching handles, and notify stakeholders automatically.`,
      },
    ]);
  };

  return (
    <Card className="flex h-full min-h-[580px] max-h-[min(700px,calc(100vh-6rem))] w-full max-w-[440px] flex-col gap-4 p-4 shadow-2xl rounded-2xl bg-white border border-[rgba(0,29,61,0.08)]">
      {/* Top Header Controls with Bot Icon */}
      <div className="flex flex-row items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Image
            src="/icons8-message-bot-100.png"
            alt="AI Bot"
            width={24}
            height={24}
            className="object-contain"
          />
          <span className="text-xs font-bold text-[#001d3d]">AI Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="size-8 text-slate-400 hover:text-slate-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 24 24"
              className="size-4 text-muted-foreground"
            >
              <path
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 5a1 1 0 1 0 2 0a1 1 0 1 0-2 0m7 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0m7 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0M4 12a1 1 0 1 0 2 0a1 1 0 1 0-2 0m7 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0m7 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0M4 19a1 1 0 1 0 2 0a1 1 0 1 0-2 0m7 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0m7 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0"
              />
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-slate-400 hover:text-slate-600"
            onClick={onClose}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4 text-muted-foreground"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M18 6l-12 12" />
              <path d="M6 6l12 12" />
            </svg>
          </Button>
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col p-0 overflow-y-auto">
        <div className="flex flex-col items-center justify-center space-y-6 p-4">
          {/* User's Bot Icon in the center */}
          <div className="flex size-14 items-center justify-center rounded-2xl bg-[#f0fdfa] border border-[rgba(20,184,166,0.15)] shadow-xs">
            <Image
              src="/icons8-message-bot-100.png"
              alt="HR Assistant Bot"
              width={48}
              height={48}
              className="object-contain drop-shadow-sm"
              priority
            />
          </div>

          {/* Heading */}
          <div className="flex flex-col space-y-2 text-center">
            <div className="flex flex-col">
              <h2 className="text-xl font-medium tracking-tight text-slate-500">
                Hi {greetingName},
              </h2>
              <h3 className="text-lg font-semibold tracking-tight text-[#001d3d]">
                Welcome back! How can I help?
              </h3>
            </div>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              I&apos;m here to help you build HR workflows. Choose from the prompts below or just tell me what you need!
            </p>
          </div>

          {/* 6 Quick Prompt Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge
              variant="secondary"
              onClick={() => handlePromptClick("Help me build a new workflow")}
              className="h-7 min-w-7 cursor-pointer gap-1.5 text-xs rounded-md hover:bg-slate-100 transition"
            >
              <ImageIcon aria-hidden="true" className="text-blue-500 size-3.5" />
              Create flow
            </Badge>
            <Badge
              variant="secondary"
              onClick={() => handlePromptClick("Analyze attendance data under 75%")}
              className="h-7 min-w-7 cursor-pointer gap-1.5 text-xs rounded-md hover:bg-slate-100 transition"
            >
              <ChartNetworkIcon
                aria-hidden="true"
                className="text-orange-500 size-3.5"
              />
              Analyze data
            </Badge>
            <Badge
              variant="secondary"
              onClick={() => handlePromptClick("Make an HR onboarding plan")}
              className="h-7 min-w-7 cursor-pointer gap-1.5 text-xs rounded-md hover:bg-slate-100 transition"
            >
              <MapIcon aria-hidden="true" className="text-green-500 size-3.5" />
              Make a plan
            </Badge>
            <Badge
              variant="secondary"
              onClick={() => handlePromptClick("Screen candidate assessment results")}
              className="h-7 min-w-7 cursor-pointer gap-1.5 text-xs rounded-md hover:bg-slate-100 transition"
            >
              <ScanTextIcon aria-hidden="true" className="text-pink-500 size-3.5" />
              Screen candidate
            </Badge>
            <Badge
              variant="secondary"
              onClick={() => handlePromptClick("Help me draft an email alert")}
              className="h-7 min-w-7 cursor-pointer gap-1.5 text-xs rounded-md hover:bg-slate-100 transition"
            >
              <PenToolIcon aria-hidden="true" className="text-yellow-500 size-3.5" />
              Help me write
            </Badge>
            <Badge
              variant="secondary"
              onClick={() => handlePromptClick("Suggest more HR automation ideas")}
              className="h-7 min-w-7 cursor-pointer gap-1.5 text-xs rounded-md hover:bg-slate-100 transition"
            >
              <SparklesIcon aria-hidden="true" className="text-purple-500 size-3.5" />
              More ideas
            </Badge>
          </div>
        </div>

        {/* Chat History if any */}
        {messages.length > 0 && (
          <div className="px-3 pb-3 space-y-2 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-xl ${
                  m.sender === "user"
                    ? "bg-[#001d3d] text-white ml-6 text-right"
                    : "bg-[#f0fdfa] border border-[rgba(20,184,166,0.2)] text-slate-700 mr-6 whitespace-pre-line"
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>
        )}

        {/* Textarea & Actions Box */}
        <div className="relative mt-auto flex-col rounded-xl border border-slate-200 bg-white shadow-2xs">
          <div className="relative">
            <Textarea
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="peer bg-transparent min-h-[90px] resize-none rounded-b-none border-none py-3 ps-9 pe-9 shadow-none text-xs text-[#001d3d] focus-visible:ring-0"
            />

            <div className="pointer-events-none absolute start-0 top-[14px] flex items-center justify-center ps-3 text-slate-400 peer-disabled:opacity-50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                viewBox="0 0 24 24"
                className="size-4"
              >
                <g fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11.5" cy="11.5" r="9.5" />
                  <path strokeLinecap="round" d="M18.5 18.5L22 22" />
                </g>
              </svg>
            </div>

            <button
              className="absolute end-0 bottom-6 flex h-full w-9 items-center justify-center rounded-e-md text-slate-400 transition-colors outline-none hover:text-slate-600 focus:z-10 focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Record audio"
              type="button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                viewBox="0 0 24 24"
                className="size-4"
              >
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M5.25 8a6.75 6.75 0 0 1 13.5 0v5a6.75 6.75 0 0 1-13.5 0zM12 2.75A5.25 5.25 0 0 0 6.75 8v5a5.25 5.25 0 1 0 10.5 0V8c0-2.9-2.35-5.25-5.25-5.25m-1.485 4.295a.75.75 0 0 1-1.06-1.06l.534.504a37 37 0 0 1-.533-.505v-.001l.002-.002l.004-.003l.008-.008l.064-.06q.054-.047.139-.106c.113-.078.268-.167.473-.25c.41-.165 1.008-.304 1.854-.304s1.444.139 1.854.305c.205.083.36.17.473.249a2 2 0 0 1 .203.166l.008.008l.004.003l.001.002h.001c0 .001.001.002-.533.506l.534-.504a.75.75 0 0 1-1.068 1.055a1 1 0 0 0-.186-.095c-.207-.084-.61-.195-1.291-.195s-1.084.111-1.291.195a1 1 0 0 0-.194.1m0 3.001a.75.75 0 0 1-1.06-1.061L10 9.5a46 46 0 0 1-.544-.516v-.001l.002-.002l.004-.003l.008-.008l.064-.06q.054-.047.139-.106c.113-.078.268-.167.473-.25c.41-.165 1.008-.304 1.854-.304s1.444.139 1.854.305c.205.082.36.17.473.249a2 2 0 0 1 .203.166l.008.008l.004.003l.001.002h.001c0 .001.001.002-.544.517l.545-.515a.75.75 0 0 1-1.06 1.06l-.008-.005a1 1 0 0 0-.186-.095c-.207-.084-.61-.195-1.291-.195s-1.084.111-1.291.195a1 1 0 0 0-.186.095zm2.942-.029h-.001M3 10.25a.75.75 0 0 1 .75.75v2a8.25 8.25 0 0 0 16.5 0v-2a.75.75 0 0 1 1.5 0v2c0 5.385-4.365 9.75-9.75 9.75S2.25 18.385 2.25 13v-2a.75.75 0 0 1 .75-.75"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Bottom Bar: Model Selector, Attach, Shortcuts & Send Button with icons8-send-64.png */}
          <div className="flex items-center justify-between rounded-b-xl border-t border-slate-100 bg-slate-50/80 px-3 py-2">
            <Select defaultValue="gpt-4">
              <SelectTrigger className="h-7! bg-white text-xs w-[90px] border-slate-200">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="text-xs" value="gpt-4">
                  GPT-4
                </SelectItem>
                <SelectItem className="text-xs" value="gpt-3.5">
                  GPT-3.5
                </SelectItem>
                <SelectItem className="text-xs" value="gpt-3.5-turbo">
                  GPT-3.5 Turbo
                </SelectItem>
                <SelectItem className="text-xs" value="gpt-3.5-turbo-16k">
                  GPT-3.5 Turbo 16k
                </SelectItem>
                <SelectItem className="text-xs" value="gpt-4-32k">
                  GPT-4 32k
                </SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1.5">
              <Button
                className="h-7! px-2! gap-1 text-[11px] text-slate-500 hover:text-slate-800"
                variant="ghost"
                type="button"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="1em"
                  height="1em"
                  viewBox="0 0 24 24"
                  className="size-3.5 text-muted-foreground"
                >
                  <path
                    fill="currentColor"
                    d="M6.17 6.309a5.317 5.317 0 0 1 7.522 0a5.326 5.326 0 0 1 0 7.529l-1.43 1.43a.75.75 0 0 0 1.06 1.061l1.43-1.431a6.826 6.826 0 0 0 0-9.65a6.817 6.817 0 0 0-9.644 0l-2.86 2.864A6.826 6.826 0 0 0 6.69 19.749a.75.75 0 1 0 .083-1.498a5.326 5.326 0 0 1-3.465-9.08z"
                  />
                  <path
                    fill="currentColor"
                    d="M17.31 4.251a.75.75 0 0 0-.083 1.498a5.326 5.326 0 0 1 3.465 9.08L17.83 17.69a5.317 5.317 0 0 1-7.523 0a5.326 5.326 0 0 1 0-7.528l1.43-1.432a.75.75 0 0 0-1.06-1.06l-1.43 1.431a6.826 6.826 0 0 0 0 9.65a6.817 6.817 0 0 0 9.644 0l2.86-2.864A6.826 6.826 0 0 0 17.31 4.251"
                  />
                </svg>
                Attach
              </Button>
              <Button
                className="h-7! px-2! gap-1 text-[11px] text-slate-500 hover:text-slate-800"
                variant="ghost"
                type="button"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="1em"
                  height="1em"
                  viewBox="0 0 24 24"
                  className="size-3.5 text-muted-foreground"
                >
                  <g fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path
                      strokeLinecap="round"
                      d="M13.294 7.17L12 12l-1.294 4.83"
                    />
                    <path d="M2 12c0-4.714 0-7.071 1.464-8.536C4.93 2 7.286 2 12 2s7.071 0 8.535 1.464C22 4.93 22 7.286 22 12s0 7.071-1.465 8.535C19.072 22 16.714 22 12 22s-7.071 0-8.536-1.465C2 19.072 2 16.714 2 12Z" />
                  </g>
                </svg>
                Shortcuts
              </Button>

              {/* User's Send Icon button using icons8-send-64.png */}
              <Button
                className="size-7! p-0! bg-[#14b8a6] text-white hover:bg-[#0d9488] rounded-lg flex items-center justify-center shadow-xs ml-1"
                type="button"
                onClick={handleSend}
                title="Send message"
              >
                <Image
                  src="/icons8-send-64.png"
                  alt="Send"
                  width={16}
                  height={16}
                  className="object-contain brightness-0 invert"
                />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const AiAssistantCard = Component;
export default Component;
