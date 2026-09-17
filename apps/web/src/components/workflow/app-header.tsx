"use client";

import { Button } from "@/components/ui/button";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

type AppHeaderProps = {
  title?: string;
  className?: string;
};

export function AppHeader({
  title = "HR Automation",
  className,
}: AppHeaderProps) {
  const { data: session } = useSession();

  return (
    <header
      className={`flex items-center justify-between gap-4 border-b border-[rgba(0,29,61,0.06)] bg-white/80 px-6 py-3 backdrop-blur-md ${className ?? ""}`}
    >
      <div className="flex min-w-0 items-center gap-4">
        <Link
          href="/dashboard"
          className="truncate text-lg font-semibold tracking-tight text-[#001d3d]"
        >
          {title}
        </Link>
        <nav className="hidden items-center gap-3 text-sm text-[#64748b] sm:flex">
          <Link href="/dashboard" className="hover:text-[#14b8a6] transition-colors">
            Dashboard
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden max-w-[140px] truncate text-sm text-[#64748b] md:inline">
          {session?.user?.name ?? session?.user?.email}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="text-[#94a3b8] hover:text-[#001d3d] hover:bg-[#faf8f3]"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          Sign out
        </Button>
      </div>
    </header>
  );
}
