"use client";

import { Button } from "@/components/ui/button";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type AppHeaderProps = {
  title?: string;
  showBuilderActions?: boolean;
  onSave?: () => void;
  onRun?: () => void;
  saveStatus?: string;
  className?: string;
};

export function AppHeader({
  title = "HR Automation",
  showBuilderActions = false,
  onSave,
  onRun,
  saveStatus,
  className,
}: AppHeaderProps) {
  const { data: session } = useSession();

  return (
    <header
      className={cn(
        "flex items-center justify-between gap-4 border-b border-white/10 bg-background/80 px-4 py-3 backdrop-blur-md",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-4">
        <Link
          href="/dashboard"
          className="truncate text-lg font-semibold tracking-tight"
        >
          {title}
        </Link>
        <nav className="hidden items-center gap-3 text-sm text-muted-foreground sm:flex">
          <Link href="/dashboard" className="hover:text-foreground">
            Dashboard
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {showBuilderActions && (
          <>
            {saveStatus && (
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {saveStatus}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={onSave}>
              Save
            </Button>
            <Button size="sm" onClick={onRun}>
              Run Now
            </Button>
          </>
        )}
        <span className="hidden max-w-[140px] truncate text-sm text-muted-foreground md:inline">
          {session?.user?.name ?? session?.user?.email}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          Sign out
        </Button>
      </div>
    </header>
  );
}
