"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Loader2, Plus, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/workflow/app-header";
import {
  deleteWorkflow,
  listWorkflows,
  type WorkflowDocument,
} from "@/lib/workflow";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [workflows, setWorkflows] = useState<WorkflowDocument[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      setWorkflows(listWorkflows());
    }
  }, [status]);

  if (status === "loading" || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8f3]">
        <Loader2 className="h-10 w-10 animate-spin text-[#14b8a6]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#faf8f3] relative">
      {/* Dot grid background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,29,61,0.12) 1px, transparent 0)`,
          backgroundSize: "16px 16px",
        }}
      />
      <div className="relative z-10">
        <AppHeader />

        <main className="mx-auto max-w-5xl px-6 py-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-[#001d3d]">Dashboard</h1>
              <p className="mt-2 text-[#64748b]">
                Welcome back{session.user?.name ? `, ${session.user.name}` : ""}.
                Design workflows and run automations.
              </p>
            </div>
            <Button asChild className="bg-[#14b8a6] hover:bg-[#0d9488] text-white">
              <Link href="/workflows/new">
                <Plus className="size-4" />
                Create workflow
              </Link>
            </Button>
          </div>

          {workflows.length === 0 ? (
            <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-[rgba(0,29,61,0.08)] bg-white px-6 py-16 text-center shadow-sm">
              <Workflow className="mb-4 size-10 text-[#14b8a6]" />
              <h2 className="text-lg font-medium text-[#001d3d]">No workflows yet</h2>
              <p className="mt-2 max-w-sm text-sm text-[#64748b]">
                Create your first automation. Build workflows with drag-and-drop
                nodes and connect them to HR data sources.
              </p>
              <Button className="mt-6 bg-[#14b8a6] hover:bg-[#0d9488] text-white" asChild>
                <Link href="/workflows/new">
                  <Plus className="size-4" />
                  Create workflow
                </Link>
              </Button>
            </div>
          ) : (
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {workflows.map((w) => (
                <li
                  key={w.id}
                  className="rounded-xl border border-[rgba(0,29,61,0.08)] bg-white p-4 shadow-sm transition hover:shadow-md hover:border-[rgba(20,184,166,0.2)]"
                >
                  <Link href={`/workflows/${w.id}`} className="block">
                    <p className="font-medium text-[#001d3d]">{w.name}</p>
                    <p className="mt-1 text-xs text-[#94a3b8]">
                      {w.nodes.length} nodes · Updated{" "}
                      {new Date(w.updatedAt).toLocaleString()}
                    </p>
                  </Link>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" asChild className="border-[rgba(0,29,61,0.1)] text-[#001d3d] hover:bg-[#f0fdfa] hover:text-[#14b8a6] hover:border-[rgba(20,184,166,0.2)]">
                      <Link href={`/workflows/${w.id}`}>Open</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-[#94a3b8] hover:text-red-500 hover:bg-red-50"
                      onClick={() => {
                        deleteWorkflow(w.id);
                        setWorkflows(listWorkflows());
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>
    </div>
  );
}
