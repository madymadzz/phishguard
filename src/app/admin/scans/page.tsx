"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Download,
  RefreshCw,
  QrCode,
  Link as LinkIcon,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Layers,
  Code,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Scan } from "@/types/database.types";

interface ScanWithProfile extends Scan {
  profiles?: {
    email?: string;
    display_name?: string;
  };
}

function AdminScansContent() {
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get("userId") || "";

  const [scans, setScans] = useState<ScanWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [userIdFilter, setUserIdFilter] = useState(initialUserId);

  // Inspection Drawer
  const [selectedScan, setSelectedScan] = useState<ScanWithProfile | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchScans = useCallback(
    async (targetPage = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(targetPage));
        params.set("limit", "15");
        if (search) params.set("search", search);
        if (riskFilter !== "all") params.set("risk", riskFilter);
        if (sourceFilter !== "all") params.set("source", sourceFilter);
        if (userIdFilter) params.set("userId", userIdFilter);

        const res = await fetch(`/api/admin/scans?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load telemetry");
        const json = await res.json();
        setScans(json.scans || []);
        setTotal(json.total || 0);
        setPage(json.page || 1);
        setTotalPages(json.totalPages || 1);
      } catch (err) {
        console.error("Error fetching scans:", err);
      } finally {
        setLoading(false);
      }
    },
    [search, riskFilter, sourceFilter, userIdFilter]
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const params = new URLSearchParams();
        params.set("page", "1");
        params.set("limit", "15");
        if (search) params.set("search", search);
        if (riskFilter !== "all") params.set("risk", riskFilter);
        if (sourceFilter !== "all") params.set("source", sourceFilter);
        if (userIdFilter) params.set("userId", userIdFilter);

        const res = await fetch(`/api/admin/scans?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load telemetry");
        const json = await res.json();
        if (!cancelled) {
          setScans(json.scans || []);
          setTotal(json.total || 0);
          setPage(json.page || 1);
          setTotalPages(json.totalPages || 1);
        }
      } catch (err) {
        console.error("Error loading scans:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [search, riskFilter, sourceFilter, userIdFilter]);

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    params.set("format", "csv");
    if (search) params.set("search", search);
    if (riskFilter !== "all") params.set("risk", riskFilter);
    if (sourceFilter !== "all") params.set("source", sourceFilter);
    if (userIdFilter) params.set("userId", userIdFilter);

    window.open(`/api/admin/scans?${params.toString()}`, "_blank");
  };

  const handleDeleteScan = async (id: string) => {
    if (!window.confirm("Permanently delete this scan from telemetry?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/scans?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setScans((prev) => prev.filter((s) => s.id !== id));
        setTotal((prev) => Math.max(0, prev - 1));
        if (selectedScan?.id === id) setSelectedScan(null);
      }
    } catch (err) {
      console.error("Failed to delete scan:", err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#1F2F3D] dark:text-[#F1F5F9] tracking-tight">
            Global Scan Telemetry
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review detailed threat signals, redirect chains, AI evaluations, and export datasets.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchScans(page)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#16222E] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#0B5FFF]" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0B5FFF] text-white text-xs font-bold hover:bg-[#0747C7] transition-all shadow-md shadow-blue-500/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search scans by domain, URL, or input value…"
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0B5FFF]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Risk Level Filter */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="text-xs py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#0B5FFF]"
          >
            <option value="all">All Risk Levels</option>
            <option value="safe">Safe Only</option>
            <option value="suspicious">Suspicious Only</option>
            <option value="dangerous">High Risk Only</option>
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="text-xs py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#0B5FFF]"
          >
            <option value="all">All Sources</option>
            <option value="url">URLs Only</option>
            <option value="qr">QR Codes Only</option>
          </select>

          {userIdFilter && (
            <button
              onClick={() => setUserIdFilter("")}
              className="text-xs py-2.5 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0B5FFF] font-bold border border-blue-200 dark:border-blue-900/60 flex items-center gap-1.5"
            >
              <span>User Filtered</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Scans Table */}
      <div className="rounded-3xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/40 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Destination / Domain</th>
                <th className="py-3.5 px-4">Verdict</th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {loading && scans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#0B5FFF]" />
                      <span>Loading scan telemetry…</span>
                    </div>
                  </td>
                </tr>
              ) : scans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No scans found matching current filters.
                  </td>
                </tr>
              ) : (
                scans.map((s) => {
                  const isSafe = s.risk_level === "safe";
                  const isSuspicious = s.risk_level === "suspicious";

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => setSelectedScan(s)}
                    >
                      {/* Type icon */}
                      <td className="py-3.5 px-4">
                        <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                          {s.source === "qr" ? <QrCode className="w-3.5 h-3.5" /> : <LinkIcon className="w-3.5 h-3.5" />}
                        </div>
                      </td>

                      {/* Domain / Input */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-[#1F2F3D] dark:text-[#F1F5F9] truncate font-mono text-[11px]">
                          {s.hostname || s.registrable_domain || s.input_value}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {s.final_url || s.input_value}
                        </div>
                      </td>

                      {/* Risk Level Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isSafe
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-[#13733A] dark:text-emerald-400"
                              : isSuspicious
                              ? "bg-amber-50 dark:bg-amber-950/60 text-[#B45309] dark:text-amber-400"
                              : "bg-red-50 dark:bg-red-950/60 text-[#B91C1C] dark:text-red-400"
                          }`}
                        >
                          {isSafe ? (
                            <ShieldCheck className="w-3 h-3" />
                          ) : isSuspicious ? (
                            <AlertTriangle className="w-3 h-3" />
                          ) : (
                            <AlertOctagon className="w-3 h-3" />
                          )}
                          <span>
                            {isSafe ? "SAFE" : isSuspicious ? "SUSPICIOUS" : "HIGH"} ({s.risk_score})
                          </span>
                        </span>
                      </td>

                      {/* User */}
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px] truncate max-w-[140px]">
                        {s.profiles?.email || "Anonymous"}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {formatDate(s.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedScan(s)}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#0B5FFF] text-[11px] font-bold hover:bg-blue-100 dark:hover:bg-blue-900/80 transition-colors"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={() => handleDeleteScan(s.id)}
                            disabled={deletingId === s.id}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-40"
                            title="Delete scan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {scans.length} of {total} scans
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchScans(page - 1)}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => fetchScans(page + 1)}
              disabled={page >= totalPages || loading}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Slide-Over Drawer */}
      {selectedScan && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end"
          onClick={() => setSelectedScan(null)}
        >
          <div
            className="w-full max-w-xl h-full bg-white dark:bg-[#16222E] shadow-2xl p-6 overflow-y-auto space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#0B5FFF]" />
                <h3 className="text-base font-extrabold text-[#1F2F3D] dark:text-[#F1F5F9]">
                  Scan Telemetry Inspector
                </h3>
              </div>
              <button
                onClick={() => setSelectedScan(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Verdict Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-400">Verdict</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    selectedScan.risk_level === "safe"
                      ? "bg-emerald-50 text-[#13733A] dark:bg-emerald-950/60 dark:text-emerald-400"
                      : selectedScan.risk_level === "suspicious"
                      ? "bg-amber-50 text-[#B45309] dark:bg-amber-950/60 dark:text-amber-400"
                      : "bg-red-50 text-[#B91C1C] dark:bg-red-950/60 dark:text-red-400"
                  }`}
                >
                  {selectedScan.risk_level.toUpperCase()} • Score: {selectedScan.risk_score}/100
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Input Value</span>
                <p className="text-xs font-mono break-all text-slate-700 dark:text-slate-300 mt-0.5">
                  {selectedScan.input_value}
                </p>
              </div>

              {selectedScan.final_url && (
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Final Resolved URL</span>
                  <p className="text-xs font-mono break-all text-[#0B5FFF] mt-0.5">
                    {selectedScan.final_url}
                  </p>
                </div>
              )}
            </div>

            {/* Redirect Chain */}
            {selectedScan.redirect_chain && selectedScan.redirect_chain.length > 1 && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Redirect Chain ({selectedScan.redirect_chain.length} hops)
                </span>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-1.5 font-mono text-[11px]">
                  {selectedScan.redirect_chain.map((hop, i) => (
                    <div key={i} className="flex items-center gap-2 truncate">
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className="truncate">{hop}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reasons List */}
            {selectedScan.reasons && selectedScan.reasons.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Flagged Threat Reasons
                </span>
                <div className="space-y-1.5">
                  {selectedScan.reasons.map((r, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 flex items-start gap-2 text-xs"
                    >
                      <span
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          r.severity === "danger"
                            ? "bg-red-500"
                            : r.severity === "warn"
                            ? "bg-amber-500"
                            : "bg-blue-500"
                        }`}
                      />
                      <span className="leading-relaxed">{r.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Explanation */}
            {selectedScan.ai_explanation?.summary && (
              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/50 space-y-2">
                <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Gemini AI Analysis</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedScan.ai_explanation.summary}
                </p>
              </div>
            )}

            {/* Signals JSON Viewer */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Code className="w-3.5 h-3.5" />
                <span>Detection Signals Payload</span>
              </div>
              <pre className="p-3 rounded-2xl bg-slate-900 text-slate-100 text-[10px] font-mono overflow-x-auto max-h-48 border border-slate-800">
                {JSON.stringify(selectedScan.signals || {}, null, 2)}
              </pre>
            </div>

            {/* External Result Link */}
            <div className="pt-2">
              <Link
                href={`/scan/result/${selectedScan.id}`}
                target="_blank"
                className="w-full py-2.5 px-4 rounded-xl bg-[#0B5FFF] text-white text-xs font-bold hover:bg-[#0747C7] transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/20"
              >
                <span>Open Public Result Screen</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminScansPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading telemetry…</div>}>
      <AdminScansContent />
    </Suspense>
  );
}
