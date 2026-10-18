import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/layout/BottomNav";
import { ArrowLeft, QrCode, Sparkles } from "lucide-react";

export default function QrScannerPlaceholderPage() {
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
            QR Scanner
          </span>
          <div className="w-5" />
        </div>
      }
      footerContent={<BottomNav />}
    >
      <div className="flex-1 px-5 py-10 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <QrCode className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-black text-[#1F2F3D] dark:text-[#F1F5F9]">
          QR Code Viewfinder
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
          The camera viewfinder, flashlight toggle, gallery photo decoding, and haptic feedback will be connected in Phase 4.
        </p>
        <Link
          href="/home"
          className="inline-flex items-center gap-1.5 py-2.5 px-4 bg-[#0B5FFF] text-white text-xs font-bold rounded-xl"
        >
          <Sparkles className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </AppShell>
  );
}
