"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import SignInModal from "@/components/sign-in";
import { GradientBackground } from "@/components/GradientBackground";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const fadeUpVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function App() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  if (status === "loading" || session) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-white text-zinc-900">
      <GradientBackground />

      <main className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-16 px-4 pt-32 pb-12 md:px-6 lg:px-8">
        <div className="mx-auto flex max-w-2xl flex-col gap-6 text-center">
          <div className="flex flex-col gap-2 text-center">
            <motion.h1
              className="text-4xl font-medium tracking-tight text-zinc-900 md:text-5xl"
              variants={fadeUpVariants}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.5 }}
            >
              Design workflows. Run them safely.
            </motion.h1>

            <motion.p
              className="mx-auto max-w-md text-lg text-zinc-600"
              variants={fadeUpVariants}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              HR Automation is your control plane for HR ops. Build workflows,
              trigger Manual Run, and let workers execute each step.
            </motion.p>
          </div>

          <motion.div
            className="flex items-center justify-center gap-2"
            variants={fadeUpVariants}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <SignInModal trigger={<Button size="lg">Get started</Button>} />
          </motion.div>
        </div>

        <motion.div
          className="w-full max-w-5xl overflow-hidden rounded-3xl border border-teal-200/60 bg-white/80 p-2 shadow-sm backdrop-blur-sm sm:p-3"
          variants={fadeUpVariants}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-[#f8fafc]">
            <Image
              src="/workflow-preview.png"
              alt="HR Automation workflow builder preview"
              width={1600}
              height={780}
              priority
              quality={95}
              className="h-auto w-full object-contain"
              sizes="(max-width: 1024px) 100vw, 1024px"
            />
          </div>
        </motion.div>

        <footer className="flex items-center gap-2 text-sm text-zinc-500">
          <p>© {new Date().getFullYear()} HR Automation. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}
