import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/AppShell";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Shield, User, LogOut, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const displayName = profile?.display_name || user.email?.split("@")[0] || "User";

  return (
    <AppShell
      showHeader={true}
      headerContent={
        <div className="w-full flex items-center justify-between">
          <Logo size="sm" showTagline={false} />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="p-2 rounded-xl text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      }
    >
      <div className="flex-1 px-5 py-6 flex flex-col justify-between">
        <div className="space-y-5">
          {/* Greeting Banner */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Welcome back,
              </span>
              <h1 className="text-xl font-extrabold text-[#1F2F3D] dark:text-[#F1F5F9]">
                {displayName}
              </h1>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#EBF2FF] dark:bg-[#1E293B] border border-blue-200 dark:border-blue-900/50 flex items-center justify-center text-[#0B5FFF] font-bold text-sm">
              <User className="w-5 h-5" />
            </div>
          </div>

          {/* Hero Banner */}
          <div className="w-full bg-[#0B5FFF] text-white p-5 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-2 text-blue-200 text-xs font-bold uppercase tracking-wider">
              <Shield className="w-4 h-4" />
              <span>Real-Time Protection Active</span>
            </div>
            <h2 className="text-lg font-bold">Stay Alert. Stay Secure.</h2>
            <p className="text-xs text-blue-100 mt-1 leading-relaxed">
              PhishGuard is ready to inspect your links and QR codes before you tap.
            </p>
          </div>

          {/* Session Verification Card */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16222E] space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#13733A] dark:text-[#4ADE80]">
              <CheckCircle2 className="w-4 h-4 text-[#22A559]" />
              <span>Authentication Verified</span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <div>
                <span className="text-slate-400">Email:</span>{" "}
                <span className="font-mono">{user.email}</span>
              </div>
              <div>
                <span className="text-slate-400">Role:</span>{" "}
                <span className="font-semibold uppercase tracking-wider text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                  {profile?.role || "user"}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Account Status:</span>{" "}
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold uppercase text-[11px]">
                  {profile?.status || "active"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
          PhishGuard Database + Auth Phase 1 Complete
        </div>
      </div>
    </AppShell>
  );
}
