import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile, getRecentScans, getUserScanStats, getFeaturedTip } from "@/lib/supabase/queries";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/layout/BottomNav";
import { Logo } from "@/components/ui/logo";
import { formatDate } from "@/lib/utils";
import {
  Link as LinkIcon,
  QrCode,
  Shield,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  ArrowRight,
  Sparkles,
  Lightbulb,
  Clock,
} from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [profile, recentScans, stats, tip] = await Promise.all([
    getUserProfile(user.id),
    getRecentScans(user.id, 3),
    getUserScanStats(user.id),
    getFeaturedTip(),
  ]);

  const displayName = profile?.display_name || user.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <AppShell
      showHeader={true}
      headerContent={
        <div className="w-full flex items-center justify-between">
          <Logo size="sm" showTagline={false} />
          <Link
            href="/profile"
            className="w-9 h-9 rounded-full bg-[#EBF2FF] dark:bg-[#1E293B] border border-blue-200 dark:border-blue-900/60 flex items-center justify-center text-[#0B5FFF] font-bold text-xs hover:ring-2 hover:ring-[#0B5FFF] transition-all"
            aria-label="Open profile"
          >
            {initials || "U"}
          </Link>
        </div>
      }
      footerContent={<BottomNav />}
    >
      <div className="flex-1 px-5 py-5 space-y-6">
        {/* User Greeting */}
        <div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Welcome back,
          </span>
          <h1 className="text-2xl font-black text-[#1F2F3D] dark:text-[#F1F5F9] tracking-tight">
            Hi, {displayName} 👋
          </h1>
        </div>

        {/* Hero Banner: Stay Alert. Stay Secure. */}
        <div className="w-full bg-gradient-to-br from-[#0B5FFF] to-[#073EB3] text-white p-5 rounded-3xl shadow-lg shadow-blue-500/15 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-1.5 text-blue-200 text-[11px] font-bold uppercase tracking-wider mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Phishing Defense Active</span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">Stay Alert. Stay Secure.</h2>
          <p className="text-xs text-blue-100 mt-1 max-w-xs leading-relaxed">
            Verify links and QR codes with layered AI inspection before opening them.
          </p>
        </div>

        {/* Big Primary Scanner Actions */}
        <div className="grid grid-cols-2 gap-3.5">
          {/* URL Scanner Card */}
          <Link
            href="/scan/url"
            className="group relative p-4 rounded-3xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-[#0B5FFF] dark:hover:border-[#0B5FFF] hover:shadow-md transition-all flex flex-col justify-between h-40 active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#EBF2FF] dark:bg-[#1E293B] text-[#0B5FFF] flex items-center justify-center transition-transform group-hover:scale-105">
              <LinkIcon className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-base font-extrabold text-[#1F2F3D] dark:text-[#F1F5F9] leading-tight">
                URL Scanner
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                Check links & web domains
              </p>
            </div>
          </Link>

          {/* QR Code Scanner Card */}
          <Link
            href="/scan/qr"
            className="group relative p-4 rounded-3xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-[#0B5FFF] dark:hover:border-[#0B5FFF] hover:shadow-md transition-all flex flex-col justify-between h-40 active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center transition-transform group-hover:scale-105">
              <QrCode className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-base font-extrabold text-[#1F2F3D] dark:text-[#F1F5F9] leading-tight">
                QR Scanner
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                Camera & gallery upload
              </p>
            </div>
          </Link>
        </div>

        {/* Tiny Stats Row */}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-col border-r border-slate-100 dark:border-slate-800 pr-3">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Scans this week
            </span>
            <span className="text-xl font-black text-[#1F2F3D] dark:text-[#F1F5F9] mt-0.5">
              {stats.scansThisWeek}
            </span>
          </div>

          <div className="flex flex-col pl-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Threats caught
            </span>
            <span className="text-xl font-black text-[#E5484D] mt-0.5">
              {stats.threatsCaught}
            </span>
          </div>
        </div>

        {/* Scan History Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Recent Scans
            </h2>
            <Link
              href="/history"
              className="text-xs font-bold text-[#0B5FFF] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentScans.length > 0 ? (
            <div className="space-y-2">
              {recentScans.map((scan) => {
                const isSafe = scan.risk_level === "safe";
                const isSuspicious = scan.risk_level === "suspicious";

                return (
                  <Link
                    key={scan.id}
                    href={`/scan/result/${scan.id}`}
                    className="p-3.5 rounded-2xl bg-white dark:bg-[#16222E] border border-slate-200/70 dark:border-slate-800 flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-600 dark:text-slate-300">
                        {scan.source === "qr" ? (
                          <QrCode className="w-4 h-4" />
                        ) : (
                          <LinkIcon className="w-4 h-4" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-xs font-bold text-[#1F2F3D] dark:text-[#F1F5F9] truncate">
                          {scan.hostname || scan.input_value}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {formatDate(scan.created_at)}
                        </div>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 shrink-0 ${
                        isSafe
                          ? "bg-[#E6F6EC] text-[#13733A] dark:bg-[#0E2E1C] dark:text-[#4ADE80]"
                          : isSuspicious
                          ? "bg-[#FEF3DC] text-[#B45309] dark:bg-[#3D2905] dark:text-[#FCD34D]"
                          : "bg-[#FDECEC] text-[#B91C1C] dark:bg-[#3A1012] dark:text-[#FCA5A5]"
                      }`}
                    >
                      {isSafe ? (
                        <ShieldCheck className="w-3 h-3" />
                      ) : isSuspicious ? (
                        <AlertTriangle className="w-3 h-3" />
                      ) : (
                        <AlertOctagon className="w-3 h-3" />
                      )}
                      <span>{isSafe ? "SAFE" : isSuspicious ? "SUSPICIOUS" : "HIGH"}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#16222E] border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                No scans recorded yet
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs mx-auto">
                Paste a link in URL Scanner or scan a code to inspect your first destination.
              </p>
            </div>
          )}
        </div>

        {/* Rotating Phishing Tip Card */}
        {tip && (
          <div className="p-4 rounded-3xl bg-amber-50/80 dark:bg-[#201809]/60 border border-amber-200/80 dark:border-amber-900/40 relative overflow-hidden">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  <Sparkles className="w-3 h-3" />
                  <span>Security Tip</span>
                </div>
                <h3 className="text-xs font-bold text-[#1F2F3D] dark:text-[#F1F5F9] mt-0.5">
                  {tip.title}
                </h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                  {tip.summary}
                </p>
                <Link
                  href={`/learn/${tip.slug}`}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline mt-2"
                >
                  <span>Learn more</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
