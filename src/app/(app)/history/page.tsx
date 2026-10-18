"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/layout/BottomNav";
import { defangUrl } from "@/lib/detection/normalize";
import type { Scan } from "@/types/database.types";
import {
  ArrowLeft,
  Trash2,
  Search,
  X,
  Link as LinkIcon,
  QrCode,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Loader2,
  Inbox,
  AlertCircle,
  Plus,
  ChevronRight,
} from "lucide-react";

export default function HistoryPage() {
  const router = useRouter();

  const [scans, setScans] = useState<Scan[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Filters
  const [sourceFilter, setSourceFilter] = useState<"all" | "url" | "qr">("all");
  const [riskFilter, setRiskFilter] = useState<"all" | "safe" | "suspicious" | "dangerous">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Modals
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [scanToDelete, setScanToDelete] = useState<Scan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [alertNotice, setAlertNotice] = useState<string | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Re-fetch on filter changes
  useEffect(() => {
    let active = true;

    async function loadScans() {
      try {
        const params = new URLSearchParams({
          page: "1",
          limit: "15",
          source: sourceFilter,
          risk: riskFilter,
          q: debouncedSearch,
        });

        const res = await fetch(`/api/scans?${params.toString()}`);
        const data = await res.json();

        if (!active) return;

        if (res.ok) {
          setScans(data.scans || []);
          setTotalCount(data.total || 0);
          setHasMore(data.hasMore || false);
          setPage(1);
        } else {
          setAlertNotice(data.error || "Failed to load scan history.");
        }
      } catch {
        if (active) setAlertNotice("Network error loading scans. Please refresh.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadScans();

    return () => {
      active = false;
    };
  }, [debouncedSearch, riskFilter, sourceFilter]);

  // Load more
  async function handleLoadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;

    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: "15",
        source: sourceFilter,
        risk: riskFilter,
        q: debouncedSearch,
      });

      const res = await fetch(`/api/scans?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setScans((prev) => [...prev, ...(data.scans || [])]);
        setTotalCount(data.total || 0);
        setHasMore(data.hasMore || false);
        setPage(nextPage);
      }
    } catch {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  }

  // Delete single scan
  async function confirmDeleteSingle() {
    if (!scanToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/scans?id=${scanToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok) {
        setScans((prev) => prev.filter((s) => s.id !== scanToDelete.id));
        setTotalCount((prev) => Math.max(0, prev - 1));
        setScanToDelete(null);
      } else {
        alert(data.error || "Failed to delete scan record.");
      }
    } catch {
      alert("Error deleting record.");
    } finally {
      setIsDeleting(false);
    }
  }

  // Clear all scans
  async function confirmClearAll() {
    setIsDeleting(true);

    try {
      const res = await fetch("/api/scans?all=true", {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok) {
        setScans([]);
        setTotalCount(0);
        setHasMore(false);
        setIsClearAllModalOpen(false);
      } else {
        alert(data.error || "Failed to clear scan history.");
      }
    } catch {
      alert("Error clearing history.");
    } finally {
      setIsDeleting(false);
    }
  }

  // Group scans by Day: "Today", "Yesterday", or formatted Date
  const groupedScans = useMemo(() => {
    const groups: { [key: string]: Scan[] } = {};

    for (const scan of scans) {
      const scanDate = new Date(scan.created_at);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      let groupKey = scanDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      if (scanDate.toDateString() === today.toDateString()) {
        groupKey = "Today";
      } else if (scanDate.toDateString() === yesterday.toDateString()) {
        groupKey = "Yesterday";
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(scan);
    }

    return groups;
  }, [scans]);

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
            Scan History
          </span>
          <button
            onClick={() => setIsClearAllModalOpen(true)}
            disabled={scans.length === 0}
            className="p-1.5 rounded-xl text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            aria-label="Clear all scan history"
            title="Clear all scans"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      }
      footerContent={<BottomNav />}
    >
      <div className="flex-1 px-4 py-3 space-y-3.5">
        {/* Search Input */}
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search domain, link, or keyword…"
            className="w-full text-xs py-2.5 pl-9 pr-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16222E] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0B5FFF]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Segmented Source Tabs */}
        <div className="flex p-1 bg-slate-100 dark:bg-[#16222E] rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400">
          {(["all", "url", "qr"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSourceFilter(tab)}
              className={`flex-1 py-1.5 rounded-lg transition-all capitalize ${
                sourceFilter === tab
                  ? "bg-white dark:bg-[#0E1620] text-[#0B5FFF] shadow-xs"
                  : "hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {tab === "all" ? "All Sources" : tab === "url" ? "URL Scans" : "QR Codes"}
            </button>
          ))}
        </div>

        {/* Risk Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px] font-bold">
          {(
            [
              { id: "all", label: "All" },
              { id: "safe", label: "Safe" },
              { id: "suspicious", label: "Suspicious" },
              { id: "dangerous", label: "High Risk" },
            ] as const
          ).map((filter) => (
            <button
              key={filter.id}
              onClick={() => setRiskFilter(filter.id)}
              className={`px-3 py-1 rounded-full transition-colors shrink-0 ${
                riskFilter === filter.id
                  ? "bg-[#0B5FFF] text-white"
                  : "bg-white dark:bg-[#16222E] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {filter.label}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-slate-400 shrink-0 font-medium">
            {totalCount} total
          </span>
        </div>

        {/* Alert Notice */}
        {alertNotice && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{alertNotice}</span>
          </div>
        )}

        {/* Scan List by Group */}
        {loading ? (
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-16 rounded-2xl bg-white dark:bg-[#16222E] border border-slate-100 dark:border-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : scans.length === 0 ? (
          /* Empty State */
          <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-[#16222E] text-slate-400 flex items-center justify-center">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-[#1F2F3D] dark:text-[#F1F5F9]">
              {searchQuery || sourceFilter !== "all" || riskFilter !== "all"
                ? "No matching scans found"
                : "No scan history yet"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
              {searchQuery || sourceFilter !== "all" || riskFilter !== "all"
                ? "Try adjusting your search keywords or filter options."
                : "Links and QR codes you inspect will be saved here for your security review."}
            </p>
            <div className="flex items-center gap-2 pt-2">
              <Link
                href="/scan/url"
                className="py-2 px-3.5 bg-[#0B5FFF] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Scan URL</span>
              </Link>
              <Link
                href="/scan/qr"
                className="py-2 px-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Scan QR</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedScans).map(([dayLabel, groupItems]) => (
              <div key={dayLabel} className="space-y-2">
                <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
                  {dayLabel}
                </h4>

                <div className="space-y-2">
                  {groupItems.map((scan) => {
                    const isDangerous = scan.risk_level === "dangerous";
                    const isSuspicious = scan.risk_level === "suspicious";

                    const badgeTheme = isDangerous
                      ? "bg-red-50 dark:bg-red-950/40 text-[#E5484D] border-red-200/50"
                      : isSuspicious
                      ? "bg-amber-50 dark:bg-amber-950/40 text-[#D97706] border-amber-200/50"
                      : "bg-emerald-50 dark:bg-emerald-950/40 text-[#22A559] border-emerald-200/50";

                    const StatusIcon = isDangerous
                      ? ShieldAlert
                      : isSuspicious
                      ? AlertTriangle
                      : ShieldCheck;

                    const scanTime = new Date(scan.created_at).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    });

                    const displayDomain =
                      scan.hostname ||
                      defangUrl(scan.final_url || scan.input_value).replace(/^hxxps?:\/\//, "");

                    return (
                      <div
                        key={scan.id}
                        className="flex items-center justify-between p-3 bg-white dark:bg-[#16222E] rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors shadow-2xs group"
                      >
                        {/* Clickable Area to navigate */}
                        <div
                          onClick={() => router.push(`/scan/result/${scan.id}`)}
                          className="flex items-center gap-3 overflow-hidden flex-1 cursor-pointer pr-2"
                        >
                          {/* Source Icon */}
                          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                            {scan.source === "qr" ? (
                              <QrCode className="w-4 h-4 text-[#0B5FFF]" />
                            ) : (
                              <LinkIcon className="w-4 h-4 text-[#0B5FFF]" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-[#1F2F3D] dark:text-[#F1F5F9] truncate font-mono">
                              {displayDomain}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                              <span>{scanTime}</span>
                              <span>•</span>
                              <span className="uppercase">{scan.source}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right Status Badge & Delete */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${badgeTheme}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            <span>{scan.risk_score}</span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setScanToDelete(scan);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                            aria-label="Delete scan record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <ChevronRight
                            onClick={() => router.push(`/scan/result/${scan.id}`)}
                            className="w-4 h-4 text-slate-300 dark:text-slate-600 cursor-pointer"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="pt-2 pb-4 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="py-2.5 px-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16222E] text-xs font-bold text-[#0B5FFF] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs inline-flex items-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Loading scans…</span>
                    </>
                  ) : (
                    <span>Load More Scans</span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Single Delete Confirmation Modal */}
      {scanToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-[#16222E] rounded-3xl p-5 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-3.5 animate-in zoom-in-95">
            <h3 className="text-sm font-bold text-[#1F2F3D] dark:text-[#F1F5F9]">
              Delete this scan?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-mono break-all">
              {scanToDelete.hostname || scanToDelete.input_value}
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setScanToDelete(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteSingle}
                disabled={isDeleting}
                className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Delete</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-[#16222E] rounded-3xl p-5 shadow-2xl border border-red-100 dark:border-red-950/50 space-y-3.5 animate-in zoom-in-95">
            <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#1F2F3D] dark:text-[#F1F5F9]">
              Clear all scan history?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              This will permanently delete all your URL and QR code scan records. This action cannot be undone.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsClearAllModalOpen(false)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmClearAll}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Clear All</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
