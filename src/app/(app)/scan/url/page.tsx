"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/layout/BottomNav";
import { ScanningAnimation } from "@/components/scanner/ScanningAnimation";
import { createClient } from "@/lib/supabase/client";
import type { Scan } from "@/types/database.types";
import {
  ArrowLeft,
  Link as LinkIcon,
  ClipboardPaste,
  X,
  Search,
  AlertCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  ChevronRight,
  Share2,
  Sparkles,
} from "lucide-react";

function UrlScannerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const [url, setUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sharedNotice, setSharedNotice] = useState<string | null>(null);
  const [recentScans, setRecentScans] = useState<Scan[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle incoming PWA Share Target parameters (?url= or ?text= or ?title=)
  useEffect(() => {
    const rawUrl = searchParams.get("url");
    const rawText = searchParams.get("text");
    const rawTitle = searchParams.get("title");

    const candidate = rawUrl || rawText || rawTitle;
    if (candidate) {
      // Extract URL from candidate text if mixed with message body (e.g. from WhatsApp/SMS)
      const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/i;
      const match = candidate.match(urlRegex);
      const extracted = match ? match[0] : candidate.trim();

      if (extracted) {
        setUrl(extracted);
        setSharedNotice("Received link shared from external app (Messenger/WhatsApp/SMS)");
        setErrorMessage(null);
        inputRef.current?.focus();
      }
    }
  }, [searchParams]);

  // Fetch recent scans
  useEffect(() => {
    async function fetchRecent() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data, error } = await supabase
            .from("scans")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(3);

          if (!error && data) {
            setRecentScans(data as unknown as Scan[]);
          }
        }
      } catch (err) {
        console.error("Failed to load recent scans:", err);
      } finally {
        setLoadingRecent(false);
      }
    }

    fetchRecent();
  }, []);

  // Clipboard Paste handler (explicit user-tap only)
  async function handlePaste() {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          // Extract URL if clipboard contains text with a link
          const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/i;
          const match = text.match(urlRegex);
          const cleanText = match ? match[0] : text.trim();

          setUrl(cleanText);
          setErrorMessage(null);
          setSharedNotice(null);
          inputRef.current?.focus();
        } else {
          setErrorMessage("Your clipboard is currently empty.");
        }
      } else {
        setErrorMessage("Clipboard access is not supported by your browser.");
      }
    } catch {
      setErrorMessage("Please grant clipboard permission to paste directly.");
    }
  }

  function handleClear() {
    setUrl("");
    setErrorMessage(null);
    setSharedNotice(null);
    inputRef.current?.focus();
  }

  async function handleScanSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();

    const trimmed = url.trim();
    if (!trimmed) {
      setErrorMessage("Please enter or paste a URL to inspect.");
      inputRef.current?.focus();
      return;
    }

    // Basic client validation
    if (trimmed.length > 2048) {
      setErrorMessage("URL exceeds the maximum length of 2048 characters.");
      return;
    }

    setErrorMessage(null);
    setIsScanning(true);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed, source: "url" }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Analysis failed. Please check the URL.");
      }

      // Navigate to full result view
      router.push(`/scan/result/${data.scanId}`);
    } catch (err) {
      setIsScanning(false);
      setErrorMessage(
        err instanceof Error ? err.message : "An error occurred during link inspection."
      );
    }
  }

  return (
    <AppShell
      showHeader={true}
      headerContent={
        <div className="w-full flex items-center justify-between">
          <Link
            href="/home"
            className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="text-sm font-bold text-[#1F2F3D] dark:text-[#F1F5F9]">
            URL Scanner
          </span>
          <div className="w-8" />
        </div>
      }
      footerContent={<BottomNav />}
    >
      <div className="flex-1 px-4 py-4 space-y-6">
        {/* If Scanning, show the animated progress steps */}
        {isScanning ? (
          <div className="bg-white dark:bg-[#16222E] rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm mt-4">
            <ScanningAnimation />
          </div>
        ) : (
          <>
            {/* Input Form Card */}
            <div className="bg-white dark:bg-[#16222E] rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0B5FFF] flex items-center justify-center">
                    <LinkIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-sm font-bold text-[#1F2F3D] dark:text-[#F1F5F9]">
                      Inspect Any Web Link
                    </h1>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Paste suspicious URLs from SMS, email, or chat
                    </p>
                  </div>
                </div>

                {/* Quick Clipboard Prompt Chip */}
                <button
                  type="button"
                  onClick={handlePaste}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#0B5FFF] hover:bg-blue-100 dark:hover:bg-blue-900/60 text-[11px] font-semibold transition-colors"
                  title="Check clipboard for link"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Scan Copied Link</span>
                </button>
              </div>

              {sharedNotice && (
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/50 text-[#0B5FFF] text-xs flex items-center gap-2 animate-in fade-in">
                  <Share2 className="w-4 h-4 shrink-0" />
                  <span>{sharedNotice}</span>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleScanSubmit} className="space-y-3">
                <div className="relative flex items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="e.g. gcash-verify.top/login or https://..."
                    className="w-full text-xs py-3 pl-3.5 pr-20 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#0E1620] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0B5FFF] transition-all font-mono"
                    disabled={isScanning}
                  />

                  {/* Right Action Buttons */}
                  <div className="absolute right-2 flex items-center gap-1">
                    {url ? (
                      <button
                        type="button"
                        onClick={handleClear}
                        className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        aria-label="Clear input"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handlePaste}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 text-[10px] font-bold transition-colors"
                        title="Paste from clipboard"
                      >
                        <ClipboardPaste className="w-3 h-3" />
                        <span>Paste</span>
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!url.trim() || isScanning}
                  className="w-full py-3 px-4 rounded-xl bg-[#0B5FFF] text-white text-xs font-bold shadow-md shadow-[#0B5FFF]/20 hover:bg-[#0A53DE] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Scan Link Now</span>
                </button>
              </form>
            </div>

            {/* Recent Scans Section */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Recent Scans</span>
                </h2>
                <Link
                  href="/history"
                  className="text-[11px] font-bold text-[#0B5FFF] hover:underline"
                >
                  View All
                </Link>
              </div>

              {loadingRecent ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-14 rounded-2xl bg-white dark:bg-[#16222E] border border-slate-100 dark:border-slate-800 animate-pulse"
                    />
                  ))}
                </div>
              ) : recentScans.length === 0 ? (
                <div className="text-center py-6 px-4 bg-white/50 dark:bg-[#16222E]/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-[11px] text-slate-400">
                  No scan history yet. Try scanning a link above!
                </div>
              ) : (
                <div className="space-y-2">
                  {recentScans.map((scan) => {
                    const isDangerous = scan.risk_level === "dangerous";
                    const isSuspicious = scan.risk_level === "suspicious";

                    const badgeBg = isDangerous
                      ? "bg-red-50 dark:bg-red-950/40 text-[#E5484D] border-red-200/50"
                      : isSuspicious
                      ? "bg-amber-50 dark:bg-amber-950/40 text-[#D97706] border-amber-200/50"
                      : "bg-emerald-50 dark:bg-emerald-950/40 text-[#22A559] border-emerald-200/50";

                    const StatusIcon = isDangerous
                      ? ShieldAlert
                      : isSuspicious
                      ? AlertTriangle
                      : ShieldCheck;

                    return (
                      <Link
                        key={scan.id}
                        href={`/scan/result/${scan.id}`}
                        className="flex items-center justify-between p-3 bg-white dark:bg-[#16222E] rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors shadow-2xs group"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${badgeBg}`}
                          >
                            <StatusIcon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#1F2F3D] dark:text-[#F1F5F9] truncate font-mono">
                              {scan.hostname || scan.input_value}
                            </p>
                            <p className="text-[10px] text-slate-400 capitalize">
                              {scan.risk_level} • Score {scan.risk_score}/100
                            </p>
                          </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function UrlScannerPage() {
  return (
    <Suspense
      fallback={
        <AppShell showHeader={false} footerContent={<BottomNav />}>
          <div className="flex-1 p-6 flex items-center justify-center">
            <ScanningAnimation />
          </div>
        </AppShell>
      }
    >
      <UrlScannerContent />
    </Suspense>
  );
}
