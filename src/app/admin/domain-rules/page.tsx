import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowRight } from "lucide-react";

export default function AdminDomainRulesPage() {
  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#1F2F3D] dark:text-[#F1F5F9] tracking-tight">
            Domain Rules Management
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Global allowlist and blocklist domain controls, CSV batch imports, and real-time engine tester.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#0B5FFF] text-xs font-bold self-start">
          Phase 8 Feature
        </span>
      </div>

      <div className="p-8 rounded-3xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 text-center space-y-4 max-w-lg mx-auto mt-8">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-[#1F2F3D] dark:text-[#F1F5F9]">
            Domain Rule Engine Active in Phase 8
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Manage global block/allow lists, import bulk domain lists via CSV, and test URLs directly against engine rules.
          </p>
        </div>
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B5FFF] text-white text-xs font-bold hover:bg-[#0747C7] transition-all"
        >
          <span>Return to Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
