"use client";

import { WifiOff, RotateCcw, Clock } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-6 shadow-sm">
        <WifiOff className="w-8 h-8" />
      </div>

      <span className="text-xs uppercase tracking-widest font-mono text-amber-500 font-semibold mb-2">
        Offline Mode
      </span>

      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
        No Internet Connection
      </h1>

      <p className="text-sm text-muted-foreground max-w-md mb-8">
        PhishGuard requires a network connection to reach threat intelligence feeds and run real-time AI security evaluations. Previously cached scans and local resources remain accessible.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <button
          onClick={() => window.location.reload()}
          className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
          Reconnect
        </button>
        <Link
          href="/history"
          className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border bg-card text-foreground font-medium text-sm hover:bg-muted transition-colors"
        >
          <Clock className="w-4 h-4" />
          View History
        </Link>
      </div>
    </div>
  );
}
