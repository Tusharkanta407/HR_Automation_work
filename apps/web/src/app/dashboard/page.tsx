"use client";

import { Button } from "@/components/ui/button";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading" || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
            HR Automation
          </Link>
          <nav className="hidden gap-4 text-sm text-muted-foreground sm:flex">
            <span className="text-foreground">Dashboard</span>
            <span className="cursor-not-allowed opacity-50">Workflows</span>
            <span className="cursor-not-allowed opacity-50">Executions</span>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {session.user?.name ?? session.user?.email}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Welcome back{session.user?.name ? `, ${session.user.name}` : ""}.
          Your automations will appear here.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border p-5">
            <p className="text-sm text-muted-foreground">Workflows</p>
            <p className="mt-2 text-3xl font-semibold">0</p>
          </div>
          <div className="rounded-xl border p-5">
            <p className="text-sm text-muted-foreground">Queued runs</p>
            <p className="mt-2 text-3xl font-semibold">0</p>
          </div>
          <div className="rounded-xl border p-5">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="mt-2 text-3xl font-semibold">0</p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border p-6">
          <h2 className="text-lg font-medium">Getting started</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Next up: seed the Low Attendance Alert workflow, wire Run Now, and
            show execution status. Auth is ready — the control plane comes next.
          </p>
        </div>
      </main>
    </div>
  );
}
