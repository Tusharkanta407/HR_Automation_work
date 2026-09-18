"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { createWorkflowApi, createWorkflowDraft } from "@/lib/workflow";

export default function NewWorkflowPage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status !== "authenticated") return;

    let isMounted = true;
    async function create() {
      const created = await createWorkflowApi({ name: "Untitled workflow" });
      if (!isMounted) return;

      if (created?.id) {
        router.replace(`/workflows/${created.id}`);
      } else {
        const draft = createWorkflowDraft("Untitled workflow");
        router.replace(`/workflows/${draft.id}`);
      }
    }

    create();

    return () => {
      isMounted = false;
    };
  }, [status, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
