"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Flag,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  X,
  MessageSquare,
  Clock,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Report, Scan } from "@/types/database.types";

interface ReportWithJoins extends Report {
  scans?: Scan;
  profiles?: {
    email?: string;
    display_name?: string;
  };
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportWithJoins[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Active editing notes
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?status=${statusFilter}`);
      if (!res.ok) throw new Error("Failed to load reports");
      const json = await res.json();
      setReports(json.reports || []);

      const notesMap: Record<string, string> = {};
      for (const r of json.reports || []) {
        notesMap[r.id] = r.admin_note || "";
      }
      setEditingNotes(notesMap);
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Error loading reports",
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/admin/reports?status=${statusFilter}`);
        if (!res.ok) throw new Error("Failed to load reports");
        const json = await res.json();
        if (!cancelled) {
          setReports(json.reports || []);
          const notesMap: Record<string, string> = {};
          for (const r of json.reports || []) {
            notesMap[r.id] = r.admin_note || "";
          }
          setEditingNotes(notesMap);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setFeedback({
            type: "error",
            message: err instanceof Error ? err.message : "Error loading reports",
          });
        }
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
  }, [statusFilter]);

  const handleUpdateStatus = async (reportId: string, newStatus: "open" | "reviewed" | "resolved") => {
    setSavingId(reportId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
      );
      setFeedback({
        type: "success",
        message: `Report status updated to ${newStatus.toUpperCase()}.`,
      });
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Update failed",
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveNote = async (reportId: string) => {
    setSavingId(reportId);
    setFeedback(null);
    try {
      const note = editingNotes[reportId] || "";
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_note: note }),
      });

      if (!res.ok) throw new Error("Failed to save note");

      setFeedback({
        type: "success",
        message: "Admin note saved successfully.",
      });
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to save note",
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleAddDomainRule = async (domain: string, ruleType: "block" | "allow", reportId: string) => {
    setSavingId(reportId);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/domain-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain,
          rule_type: ruleType,
          note: `Added from moderation report ${reportId}`,
        }),
      });

      if (!res.ok) throw new Error("Failed to add domain rule");

      setFeedback({
        type: "success",
        message: `Domain ${domain} added to ${ruleType.toUpperCase()}LIST.`,
      });
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Action failed",
      });
    } finally {
      setSavingId(null);
    }
  };

  const openCount = useMemo(() => reports.filter((r) => r.status === "open").length, [reports]);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#1F2F3D] dark:text-[#F1F5F9] tracking-tight">
            User Reports & Moderation Queue
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review user-reported false positives, false negatives, and enforce domain block/allow overrides.
          </p>
        </div>

        <button
          onClick={fetchReports}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#16222E] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#0B5FFF]" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between border ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60"
              : "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-900/60"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="p-1 rounded-md">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl w-full sm:w-auto text-xs font-bold self-start">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-4 py-1.5 rounded-xl transition-all ${
            statusFilter === "all"
              ? "bg-white dark:bg-[#16222E] text-[#1F2F3D] dark:text-[#F1F5F9] shadow-2xs"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          All Reports ({reports.length})
        </button>
        <button
          onClick={() => setStatusFilter("open")}
          className={`px-4 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
            statusFilter === "open"
              ? "bg-white dark:bg-[#16222E] text-amber-600 dark:text-amber-400 shadow-2xs"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Open ({openCount})</span>
        </button>
        <button
          onClick={() => setStatusFilter("reviewed")}
          className={`px-4 py-1.5 rounded-xl transition-all ${
            statusFilter === "reviewed"
              ? "bg-white dark:bg-[#16222E] text-blue-600 dark:text-blue-400 shadow-2xs"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Reviewed
        </button>
        <button
          onClick={() => setStatusFilter("resolved")}
          className={`px-4 py-1.5 rounded-xl transition-all ${
            statusFilter === "resolved"
              ? "bg-white dark:bg-[#16222E] text-emerald-600 dark:text-emerald-400 shadow-2xs"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Resolved
        </button>
      </div>

      {/* Reports List Cards */}
      <div className="space-y-4">
        {loading && reports.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#0B5FFF]" />
            <span>Loading moderation reports…</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 text-center space-y-2">
            <Flag className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-[#1F2F3D] dark:text-[#F1F5F9]">
              Queue Empty
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No moderation reports pending under status &quot;{statusFilter}&quot;.
            </p>
          </div>
        ) : (
          reports.map((r) => {
            const scan = r.scans;
            const targetDomain = scan?.registrable_domain || scan?.hostname || "";

            return (
              <div
                key={r.id}
                className="p-5 rounded-3xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4"
              >
                {/* Header: User Reason & Status Selector */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="font-bold text-[#1F2F3D] dark:text-[#F1F5F9]">
                        {r.profiles?.email || "Anonymous User"}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(r.created_at)}</span>
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold uppercase text-[10px] text-amber-700 dark:text-amber-400 block mb-0.5">
                          User Claim / Feedback
                        </span>
                        <span>{r.reason}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={r.status}
                      disabled={savingId === r.id}
                      onChange={(e) =>
                        handleUpdateStatus(
                          r.id,
                          e.target.value as "open" | "reviewed" | "resolved"
                        )
                      }
                      className="text-xs font-bold py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#0B5FFF]"
                    >
                      <option value="open">Open</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>

                {/* Associated Scan Details */}
                {scan ? (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-slate-400">
                          Associated Scan
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            scan.risk_level === "safe"
                              ? "bg-emerald-100 text-[#13733A] dark:bg-emerald-950 dark:text-emerald-400"
                              : scan.risk_level === "suspicious"
                              ? "bg-amber-100 text-[#B45309] dark:bg-amber-950 dark:text-amber-400"
                              : "bg-red-100 text-[#B91C1C] dark:bg-red-950 dark:text-red-400"
                          }`}
                        >
                          {scan.risk_level} ({scan.risk_score})
                        </span>
                      </div>

                      <Link
                        href={`/scan/result/${scan.id}`}
                        target="_blank"
                        className="text-[11px] font-bold text-[#0B5FFF] hover:underline flex items-center gap-1"
                      >
                        <span>View Result</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>

                    <div className="text-xs font-mono break-all text-[#1F2F3D] dark:text-[#F1F5F9] font-bold">
                      {scan.input_value}
                    </div>

                    {scan.final_url && scan.final_url !== scan.input_value && (
                      <div className="text-[11px] font-mono break-all text-slate-400">
                        Final destination: {scan.final_url}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic">
                    Original scan record has been deleted.
                  </div>
                )}

                {/* Admin Note and Quick Actions Row */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                  {/* Admin Note Input */}
                  <div className="flex items-center gap-2 w-full sm:flex-1">
                    <input
                      type="text"
                      value={editingNotes[r.id] ?? ""}
                      onChange={(e) =>
                        setEditingNotes((prev) => ({ ...prev, [r.id]: e.target.value }))
                      }
                      placeholder="Add resolution or investigation note…"
                      className="flex-1 text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#0B5FFF]"
                    />
                    <button
                      onClick={() => handleSaveNote(r.id)}
                      disabled={savingId === r.id}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                    >
                      Save Note
                    </button>
                  </div>

                  {/* One-Click Rule Actions */}
                  {targetDomain && (
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        onClick={() => handleAddDomainRule(targetDomain, "block", r.id)}
                        disabled={savingId === r.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 text-[11px] font-bold border border-red-200 dark:border-red-900/60 hover:bg-red-100 transition-colors"
                      >
                        <ShieldAlert className="w-3 h-3" />
                        <span>Block {targetDomain}</span>
                      </button>

                      <button
                        onClick={() => handleAddDomainRule(targetDomain, "allow", r.id)}
                        disabled={savingId === r.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 text-[11px] font-bold border border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100 transition-colors"
                      >
                        <ShieldCheck className="w-3 h-3" />
                        <span>Allow {targetDomain}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
