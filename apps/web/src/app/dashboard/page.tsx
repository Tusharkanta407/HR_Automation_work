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
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-2 text-muted-foreground">
              Welcome back{session.user?.name ? `, ${session.user.name}` : ""}.
              Design workflows on the Excalidraw canvas.
            </p>
          </div>
          <Button asChild>
            <Link href="/workflows/new">
              <Plus className="size-4" />
              Create workflow
            </Link>
          </Button>
        </div>

        {workflows.length === 0 ? (
          <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-16 text-center backdrop-blur-sm">
            <Workflow className="mb-4 size-10 text-muted-foreground" />
            <h2 className="text-lg font-medium">No workflows yet</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Create your first automation. You&apos;ll get a Zapier-like builder
              with an Excalidraw canvas and an HR node palette.
            </p>
            <Button className="mt-6" asChild>
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
                className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition hover:border-white/20"
              >
                <Link href={`/workflows/${w.id}`} className="block">
                  <p className="font-medium">{w.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {w.nodes.length} nodes · Updated{" "}
                    {new Date(w.updatedAt).toLocaleString()}
                  </p>
                </Link>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/workflows/${w.id}`}>Open</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
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
  );
}
