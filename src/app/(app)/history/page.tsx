import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRecentScans } from "@/lib/supabase/queries";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/layout/BottomNav";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  History,
  Link as LinkIcon,
  QrCode,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
} from "lucide-react";

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const scans = await getRecentScans(user.id, 20);

  return (
    <AppShell
      showHeader={true}
      headerContent={
        <div className="w-full flex items-center justify-between">
          <Link
            href="/home"
            className="p-1 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="text-sm font-bold text-[#1F2F3D] dark:text-[#F1F5F9]">
            Scan History
          </span>
          <div className="w-5" />
        </div>
      }
      footerContent={<BottomNav />}
    >
      <div className="flex-1 px-5 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-black text-[#1F2F3D] dark:text-[#F1F5F9]">
            All Scans
          </h1>
          <span className="text-xs text-slate-400 font-semibold">
            {scans.length} {scans.length === 1 ? "record" : "records"}
          </span>
        </div>

        {scans.length > 0 ? (
          <div className="space-y-2.5">
            {scans.map((scan) => {
              const isSafe = scan.risk_level === "safe";
              const isSuspicious = scan.risk_level === "suspicious";

              return (
                <Link
                  key={scan.id}
                  href={`/scan/result/${scan.id}`}
                  className="p-4 rounded-2xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all active:scale-[0.99]"
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
          <div className="p-8 rounded-3xl bg-white dark:bg-[#16222E] border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3 mt-6">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <History className="w-6 h-6" />
            </div>
            <h2 className="text-sm font-bold text-[#1F2F3D] dark:text-[#F1F5F9]">
              No Scan History Found
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mx-auto">
              Links or QR codes you inspect with PhishGuard will be stored here automatically.
            </p>
            <Link
              href="/home"
              className="inline-block mt-2 py-2 px-4 bg-[#0B5FFF] text-white text-xs font-bold rounded-xl"
            >
              Start Scanning
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
