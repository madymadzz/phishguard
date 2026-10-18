import { AppShell } from "@/components/layout/AppShell";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ShieldCheck, AlertTriangle, AlertOctagon, Sparkles, Smartphone, Lock } from "lucide-react";

export default function Home() {
  return (
    <AppShell
      showHeader={true}
      headerContent={
        <div className="w-full flex items-center justify-between">
          <Logo size="sm" showTagline={false} />
          <ThemeToggle />
        </div>
      }
    >
      <div className="flex-1 px-5 py-6 flex flex-col justify-between">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center mt-4">
          <Logo size="lg" showWordmark={true} showTagline={true} className="mb-6" />

          <div className="w-full bg-[#0B5FFF] text-white p-5 rounded-2xl shadow-sm relative overflow-hidden mb-6">
            <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <h2 className="text-xl font-bold mb-1">Stay Alert. Stay Secure.</h2>
            <p className="text-sm text-blue-100">
              AI-assisted phishing & malicious link defense for students and mobile users.
            </p>
          </div>

          {/* Design Tokens & Status System Preview */}
          <div className="w-full space-y-3 text-left">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
              Design Tokens & Status Verification
            </h3>

            {/* Safe Token */}
            <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-[#E6F6EC] dark:bg-[#0E2E1C]/60 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-[#22A559] shrink-0" />
              <div>
                <div className="text-xs font-bold text-[#13733A] dark:text-[#4ADE80] uppercase tracking-wide">
                  Risk Level: SAFE
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  Clean certificate, trusted domain reputation, no threat indicators.
                </div>
              </div>
            </div>

            {/* Suspicious Token */}
            <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-[#FEF3DC] dark:bg-[#3D2905]/60 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-[#F59E0B] shrink-0" />
              <div>
                <div className="text-xs font-bold text-[#B45309] dark:text-[#FCD34D] uppercase tracking-wide">
                  Risk Level: SUSPICIOUS
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  Shortened link, brand-new domain registration, or unusual redirects.
                </div>
              </div>
            </div>

            {/* Danger Token */}
            <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-[#FDECEC] dark:bg-[#3A1012]/60 flex items-center gap-3">
              <AlertOctagon className="w-6 h-6 text-[#E5484D] shrink-0" />
              <div>
                <div className="text-xs font-bold text-[#B91C1C] dark:text-[#FCA5A5] uppercase tracking-wide">
                  Risk Level: HIGH RISK
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  Known malware host, verified deceptive phishing, or spoofed login.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Foundation Info Card */}
        <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Lock className="w-3.5 h-3.5 text-[#0B5FFF]" /> Foundation Phase 0 Ready
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Smartphone className="w-3.5 h-3.5 text-[#0B5FFF]" /> Mobile-First PWA (430px)
            </span>
          </div>
          <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 mt-2">
            <Sparkles className="w-3 h-3 text-[#0B5FFF]" /> PhishGuard — Entrepreneurial Management Project
          </div>
        </div>
      </div>
    </AppShell>
  );
}
