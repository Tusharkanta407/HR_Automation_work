"use client";

import SignInModal from "@/components/sign-in";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function Login() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  if (status === "loading" || session) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <Loader2 className="h-10 w-10 animate-spin" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-transparent to-rose-800/50 p-4">
      <div className="w-full max-w-md">
        <SignInModal />
      </div>
    </main>
  );
}
