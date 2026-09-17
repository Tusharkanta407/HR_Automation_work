"use client";

import {
  CalendarCheck,
  Filter,
  Mail,
  SparklesIcon,
  UserRound,
  Workflow,
  Zap,
  X,
} from "lucide-react";
import Image from "next/image";

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

type AiAssistantCardProps = {
  userName?: string | null;
  onClose?: () => void;
  onPromptSelect?: (prompt: string) => void;
};

const HR_PROMPTS = [
  {
    icon: Zap,
    label: "Build a trigger flow",
    color: "text-[#14b8a6]",
    prompt: "Help me start a Manual Trigger workflow for HR alerts",
  },
  {
    icon: CalendarCheck,
    label: "Low attendance",
    color: "text-orange-500",
    prompt: "Design a Low Attendance Alert automation under 75%",
  },
  {
    icon: Filter,
    label: "Add a filter",
    color: "text-green-600",
    prompt: "Where should I place a Filter node in my HR workflow?",
  },
  {
    icon: UserRound,
    label: "Employee details",
    color: "text-pink-500",
    prompt: "How do I enrich filtered employees with Employee Details?",
  },
  {
    icon: Mail,
    label: "Notify by email",
    color: "text-yellow-600",
    prompt: "Help me add a mock Send Email step for HR notifications",
  },
  {
    icon: Workflow,
    label: "More ideas",
    color: "text-purple-500",
    prompt: "Suggest more HR automation workflows I can build",
  },
] as const;

export function AiAssistantCard({
  userName,
  onClose,
  onPromptSelect,
}: AiAssistantCardProps) {
  const greetingName = userName?.split(" ")[0] || "there";

  return (
    <Card className="flex h-full max-h-[min(720px,calc(100vh-6rem))] w-full max-w-[420px] flex-col gap-4 border-[rgba(0,29,61,0.08)] bg-white p-4 shadow-xl">
      <div className="flex flex-row items-center justify-between p-0">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center">
            <Image
              src="/icons8-message-bot-100.png"
              alt="HR assistant"
              width={36}
              height={36}
              className="object-contain"
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#001d3d]">HR Assistant</p>
            <p className="text-[10px] text-[#94a3b8]">Workflow help on canvas</p>
          </div>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-[#94a3b8] hover:bg-[#f0fdfa] hover:text-[#0d9488]"
            onClick={onClose}
            aria-label="Close assistant"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      <CardContent className="flex flex-1 flex-col gap-6 overflow-y-auto p-0">
        <div className="flex flex-col items-center justify-center space-y-6 px-2 py-4">
          <div className="flex size-14 items-center justify-center">
            <Image
              src="/icons8-message-bot-100.png"
              alt="HR assistant"
              width={56}
              height={56}
              className="object-contain drop-shadow-sm"
            />
          </div>

          <div className="flex flex-col space-y-2.5 text-center">
            <div className="flex flex-col">
              <h2 className="text-xl font-medium tracking-tight text-[#94a3b8]">
                Hi {greetingName},
              </h2>
              <h3 className="text-lg font-medium tracking-tight text-[#001d3d]">
                How can I help with HR flows?
              </h3>
            </div>
            <p className="text-sm text-[#64748b]">
              I can help you pick nodes, connect attendance filters, and shape
              automations. Choose a prompt below or ask anything.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {HR_PROMPTS.map(({ icon: Icon, label, color, prompt }) => (
              <Badge
                key={label}
                variant="secondary"
                role="button"
                tabIndex={0}
                onClick={() => onPromptSelect?.(prompt)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onPromptSelect?.(prompt);
                  }
                }}
                className="h-7 min-w-7 cursor-pointer gap-1.5 rounded-md border border-[rgba(20,184,166,0.12)] bg-[#f0fdfa] text-xs text-[#001d3d] hover:bg-[#ccfbf1] [&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:-ms-px"
              >
                <Icon aria-hidden="true" className={color} />
                {label}
              </Badge>
            ))}
          </div>
        </div>

        <div className="relative mt-auto flex-col rounded-md ring-1 ring-[rgba(20,184,166,0.2)]">
          <div className="relative">
            <Textarea
              placeholder="Ask about attendance, filters, email alerts..."
              className="peer min-h-[100px] resize-none rounded-b-none border-none bg-transparent py-3 pe-9 ps-9 text-[#001d3d] shadow-none placeholder:text-[#94a3b8] focus-visible:ring-[#14b8a6]/30"
            />

            <div className="pointer-events-none absolute start-0 top-[14px] flex items-center justify-center ps-3 text-[#94a3b8] peer-disabled:opacity-50">
              <SparklesIcon className="size-4" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-b-md border-t border-[rgba(0,29,61,0.06)] bg-[#f0fdfa]/80 px-3 py-2">
            <Select defaultValue="hr-helper">
              <SelectTrigger
                size="sm"
                className="h-7! w-[120px] border-[rgba(20,184,166,0.2)] bg-white text-xs text-[#001d3d]"
              >
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="text-xs" value="hr-helper">
                  HR Helper
                </SelectItem>
                <SelectItem className="text-xs" value="flow-coach">
                  Flow Coach
                </SelectItem>
              </SelectContent>
            </Select>

            <Button
              className="size-8! p-0! bg-[#14b8a6] text-white hover:bg-[#0d9488]"
              type="button"
              aria-label="Send prompt"
            >
              <Image
                src="/icons8-send-64.png"
                alt=""
                width={18}
                height={18}
                className="object-contain brightness-0 invert"
              />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const Component = AiAssistantCard;
