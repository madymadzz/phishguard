"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/logo";
import { AppShell } from "@/components/layout/AppShell";

const emptySubscribe = () => () => {};

export default function SplashScreen() {
  const router = useRouter();
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  useEffect(() => {
    const checkSessionAndRoute = async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        // Allow splash animation to play for ~1.2s
        setTimeout(() => {
          if (session?.user) {
            router.replace("/home");
          } else {
            router.replace("/login");
          }
        }, 1200);
      } catch {
        router.replace("/login");
      }
    };

    checkSessionAndRoute();
  }, [router]);

  return (
    <AppShell>
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
        {mounted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="flex flex-col items-center"
          >
            <Logo size="xl" showWordmark={true} showTagline={true} />

            {/* Subtle animated loading bar */}
            <div className="w-32 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-10">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{
                  repeat: Infinity,
                  duration: 1.2,
                  ease: "easeInOut",
                }}
                className="w-full h-full bg-[#0B5FFF] rounded-full"
              />
            </div>
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}
