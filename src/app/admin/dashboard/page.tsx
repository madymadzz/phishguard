"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  ShieldAlert,
  Activity,
  RefreshCw,
  QrCode,
  Link as LinkIcon,
  ExternalLink,
  Flag,
  Server,
  Calendar,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface StatsData {
  kpis: {
    totalUsers: number;
    newUsers7d: number;
    totalScans: number;
    scansToday: number;
    scans7d: number;
    dangerousRate: number;
    openReports: number;
  };
  verdicts: {
    safe: number;
    suspicious: number;
    dangerous: number;
  };
  sources: {
    url: number;
    qr: number;
  };
  scansPerDay: Array<{
    date: string;
    safe: number;
    suspicious: number;
    dangerous: number;
    total: number;
  }>;
  topFlaggedDomains: Array<{
    domain: string;
    count: number;
    dangerous: number;
    suspicious: number;
  }>;
  latestDangerous: Array<{
    id: string;
    input_value: string;
    hostname: string;
    registrable_domain: string;
    risk_score: number;
    created_at: string;
    source: "url" | "qr";
  }>;
  providers: {
    safeBrowsing: { name: string; configured: boolean; status: string };
    urlhaus: { name: string; configured: boolean; status: string };
    gemini: { name: string; model?: string; configured: boolean; status: string };
  };
}

interface DiagnosticResult {
  ok: boolean;
  latencyMs: number;
  message: string;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Diagnostics state
  const [testingProviders, setTestingProviders] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<{
    safeBrowsing?: DiagnosticResult;
    urlhaus?: DiagnosticResult;
    gemini?: DiagnosticResult;
  } | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to load administrative telemetry`);
      }
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/admin/stats");
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: Failed to load administrative telemetry`);
        }
        const json = await res.json();
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error fetching stats");
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
  }, []);

  const runDiagnostics = async () => {
    setTestingProviders(true);
    try {
      const res = await fetch("/api/admin/providers/test", { method: "POST" });
      if (res.ok) {
        const json = await res.json();
        setDiagnosticResults(json.results);
      }
    } catch (err) {
      console.error("Diagnostic error:", err);
    } finally {
      setTestingProviders(false);
    }
  };

  const totalVerdicts =
    (data?.verdicts.safe || 0) +
    (data?.verdicts.suspicious || 0) +
    (data?.verdicts.dangerous || 0);

  const safePct = totalVerdicts > 0 ? Math.round(((data?.verdicts.safe || 0) / totalVerdicts) * 100) : 0;
  const suspPct = totalVerdicts > 0 ? Math.round(((data?.verdicts.suspicious || 0) / totalVerdicts) * 100) : 0;
  const dangPct = totalVerdicts > 0 ? Math.max(0, 100 - safePct - suspPct) : 0;

  const totalSources = (data?.sources.url || 0) + (data?.sources.qr || 0);
  const urlPct = totalSources > 0 ? Math.round(((data?.sources.url || 0) / totalSources) * 100) : 0;
  const qrPct = totalSources > 0 ? 100 - urlPct : 0;

  // Max value in 30-day scans for chart scale
  const maxDaily = Math.max(1, ...(data?.scansPerDay.map((d) => d.total) || [1]));

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#1F2F3D] dark:text-[#F1F5F9] tracking-tight">
            Security Telemetry & Operations
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time phishing indicators, threat database health, and system-wide intelligence.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#16222E] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#0B5FFF]" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={runDiagnostics}
            disabled={testingProviders}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0B5FFF] text-white text-xs font-bold hover:bg-[#0747C7] transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
          >
            <Activity className={`w-3.5 h-3.5 ${testingProviders ? "animate-spin" : ""}`} />
            <span>{testingProviders ? "Testing Providers…" : "Run Diagnostics"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Grid (6 cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 md:gap-4">
        {/* Total Users */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Users</span>
            <Users className="w-4 h-4 text-[#0B5FFF]" />
          </div>
          <div className="text-2xl font-black text-[#1F2F3D] dark:text-[#F1F5F9]">
            {loading ? "…" : data?.kpis.totalUsers ?? 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Registered accounts</div>
        </div>

        {/* New Users (7d) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">New (7d)</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {loading ? "…" : data?.kpis.newUsers7d ?? 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Growth this week</div>
        </div>

        {/* Scans Today */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Scans Today</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-[#1F2F3D] dark:text-[#F1F5F9]">
            {loading ? "…" : data?.kpis.scansToday ?? 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Processed today</div>
        </div>

        {/* Scans 7d */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Scans (7d)</span>
            <Search className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-[#1F2F3D] dark:text-[#F1F5F9]">
            {loading ? "…" : data?.kpis.scans7d ?? 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Past 7 days volume</div>
        </div>

        {/* Dangerous Rate % */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Danger Rate</span>
            <AlertOctagon className="w-4 h-4 text-[#E5484D]" />
          </div>
          <div className="text-2xl font-black text-[#E5484D]">
            {loading ? "…" : `${data?.kpis.dangerousRate ?? 0}%`}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Flagged high risk</div>
        </div>

        {/* Open Reports */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Open Reports</span>
            <Flag className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {loading ? "…" : data?.kpis.openReports ?? 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Pending review</div>
        </div>
      </div>

      {/* Provider Health Monitor Banner */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-[#0B5FFF]" />
            <h2 className="text-sm font-bold text-[#1F2F3D] dark:text-[#F1F5F9] uppercase tracking-wider">
              Threat Intelligence & AI Providers
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">
            Live diagnostic verification of external detection APIs
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Safe Browsing */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1F2F3D] dark:text-[#F1F5F9]">
                Google Safe Browsing v4
              </span>
              {diagnosticResults?.safeBrowsing ? (
                diagnosticResults.safeBrowsing.ok ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{diagnosticResults.safeBrowsing.latencyMs}ms</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 text-[10px] font-extrabold">
                    <XCircle className="w-3 h-3" />
                    <span>Error</span>
                  </span>
                )
              ) : (
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-[#0B5FFF]">
                  Configured
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {diagnosticResults?.safeBrowsing
                ? diagnosticResults.safeBrowsing.message
                : "Active reputation lookup for known malicious URIs"}
            </p>
          </div>

          {/* URLhaus */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1F2F3D] dark:text-[#F1F5F9]">
                abuse.ch URLhaus
              </span>
              {diagnosticResults?.urlhaus ? (
                diagnosticResults.urlhaus.ok ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{diagnosticResults.urlhaus.latencyMs}ms</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 text-[10px] font-extrabold">
                    <XCircle className="w-3 h-3" />
                    <span>Error</span>
                  </span>
                )
              ) : (
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-[#0B5FFF]">
                  Configured
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {diagnosticResults?.urlhaus
                ? diagnosticResults.urlhaus.message
                : "Community-driven malware and active phishing distribution feeds"}
            </p>
          </div>

          {/* Gemini AI */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1F2F3D] dark:text-[#F1F5F9]">
                Google Gemini AI
              </span>
              {diagnosticResults?.gemini ? (
                diagnosticResults.gemini.ok ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{diagnosticResults.gemini.latencyMs}ms</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 text-[10px] font-extrabold">
                    <XCircle className="w-3 h-3" />
                    <span>Error</span>
                  </span>
                )
              ) : (
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  gemini-3.8-flash
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {diagnosticResults?.gemini
                ? diagnosticResults.gemini.message
                : "Multi-factor contextual heuristics & plain-language risk breakdowns"}
            </p>
          </div>
        </div>
      </div>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 30-Day Activity Stacked Chart (2 Columns) */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#0B5FFF]" />
              <h2 className="text-sm font-bold text-[#1F2F3D] dark:text-[#F1F5F9] uppercase tracking-wider">
                30-Day Threat Volume Trend
              </h2>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-[#22A559]" /> Safe
              </span>
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <span className="w-2 h-2 rounded-full bg-[#F59E0B]" /> Suspicious
              </span>
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <span className="w-2 h-2 rounded-full bg-[#E5484D]" /> High Risk
              </span>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="h-56 w-full flex items-end gap-1 sm:gap-2 pt-6 pb-2 px-1 border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
            {data?.scansPerDay.map((day) => {
              const safeHeight = (day.safe / maxDaily) * 100;
              const suspHeight = (day.suspicious / maxDaily) * 100;
              const dangHeight = (day.dangerous / maxDaily) * 100;
              const hasActivity = day.total > 0;

              return (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col justify-end items-center h-full group relative min-w-[10px]"
                >
                  {/* Tooltip on hover */}
                  <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center pointer-events-none">
                    <div className="px-2 py-1 rounded-md bg-[#1F2F3D] text-white text-[10px] font-semibold shadow-lg whitespace-nowrap">
                      {day.date}: {day.total} scans ({day.dangerous} high risk)
                    </div>
                  </div>

                  {/* Stacked Bar */}
                  <div className="w-full max-w-[16px] flex flex-col justify-end rounded-t-sm overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {hasActivity ? (
                      <>
                        <div
                          style={{ height: `${dangHeight}%` }}
                          className="w-full bg-[#E5484D] transition-all"
                        />
                        <div
                          style={{ height: `${suspHeight}%` }}
                          className="w-full bg-[#F59E0B] transition-all"
                        />
                        <div
                          style={{ height: `${safeHeight}%` }}
                          className="w-full bg-[#22A559] transition-all"
                        />
                      </>
                    ) : (
                      <div className="h-1 w-full bg-slate-200 dark:bg-slate-700/60" />
                    )}
                  </div>

                  {/* Day label */}
                  <span className="text-[9px] text-slate-400 mt-1.5 transform -rotate-45 sm:rotate-0 origin-center truncate">
                    {day.date.slice(8)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Breakdown Card: Verdict & Source Distributions (1 Column) */}
        <div className="space-y-6">
          {/* Verdict Distribution */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-[#1F2F3D] dark:text-[#F1F5F9] uppercase tracking-wider">
              Verdict Breakdown
            </h2>

            {/* Segmented bar */}
            <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
              <div style={{ width: `${safePct}%` }} className="bg-[#22A559] transition-all" />
              <div style={{ width: `${suspPct}%` }} className="bg-[#F59E0B] transition-all" />
              <div style={{ width: `${dangPct}%` }} className="bg-[#E5484D] transition-all" />
            </div>

            <div className="space-y-2 pt-1 text-xs font-bold">
              <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 text-[#13733A] dark:text-emerald-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Safe
                </span>
                <span>{data?.verdicts.safe ?? 0} ({safePct}%)</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 text-[#B45309] dark:text-amber-400">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Suspicious
                </span>
                <span>{data?.verdicts.suspicious ?? 0} ({suspPct}%)</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-red-50/60 dark:bg-red-950/20 text-[#B91C1C] dark:text-red-400">
                <span className="flex items-center gap-1.5">
                  <AlertOctagon className="w-3.5 h-3.5" /> High Risk
                </span>
                <span>{data?.verdicts.dangerous ?? 0} ({dangPct}%)</span>
              </div>
            </div>
          </div>

          {/* Scan Type Split */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
            <h2 className="text-sm font-bold text-[#1F2F3D] dark:text-[#F1F5F9] uppercase tracking-wider">
              Input Vector Split
            </h2>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                <LinkIcon className="w-5 h-5 text-[#0B5FFF] mx-auto mb-1" />
                <div className="text-lg font-black text-[#1F2F3D] dark:text-[#F1F5F9]">
                  {data?.sources.url ?? 0}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">
                  URLs ({urlPct}%)
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                <QrCode className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
                <div className="text-lg font-black text-[#1F2F3D] dark:text-[#F1F5F9]">
                  {data?.sources.qr ?? 0}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">
                  QR Codes ({qrPct}%)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tables Row: Top Flagged Domains & Recent Threat Detections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Flagged Domains */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#E5484D]" />
              <h2 className="text-sm font-bold text-[#1F2F3D] dark:text-[#F1F5F9] uppercase tracking-wider">
                Top Flagged Domains
              </h2>
            </div>
            <Link
              href="/admin/domain-rules"
              className="text-xs font-bold text-[#0B5FFF] hover:underline"
            >
              Manage Rules
            </Link>
          </div>

          {data?.topFlaggedDomains && data.topFlaggedDomains.length > 0 ? (
            <div className="space-y-2">
              {data.topFlaggedDomains.map((item, idx) => (
                <div
                  key={item.domain}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="w-6 h-6 rounded-lg bg-red-100 dark:bg-red-950/60 text-[#E5484D] font-extrabold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-[#1F2F3D] dark:text-[#F1F5F9] truncate font-mono">
                        {item.domain}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {item.dangerous} high risk, {item.suspicious} suspicious
                      </div>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-red-50 text-[#E5484D] dark:bg-red-950/60 dark:text-red-400">
                    {item.count} hits
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No repeated malicious domains recorded yet.
            </div>
          )}
        </div>

        {/* Latest Dangerous Scans */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-[#E5484D]" />
              <h2 className="text-sm font-bold text-[#1F2F3D] dark:text-[#F1F5F9] uppercase tracking-wider">
                Latest Dangerous Detections
              </h2>
            </div>
            <Link
              href="/admin/scans"
              className="text-xs font-bold text-[#0B5FFF] hover:underline"
            >
              All Scans
            </Link>
          </div>

          {data?.latestDangerous && data.latestDangerous.length > 0 ? (
            <div className="space-y-2">
              {data.latestDangerous.map((scan) => (
                <div
                  key={scan.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950/60 text-[#E5484D] flex items-center justify-center shrink-0">
                      {scan.source === "qr" ? <QrCode className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-[#1F2F3D] dark:text-[#F1F5F9] truncate font-mono">
                        {scan.hostname || scan.input_value}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {formatDate(scan.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-950/60 text-[#E5484D] font-extrabold text-[10px]">
                      Score: {scan.risk_score}
                    </span>
                    <Link
                      href={`/scan/result/${scan.id}`}
                      target="_blank"
                      className="p-1 rounded-lg text-slate-400 hover:text-[#0B5FFF] transition-colors"
                      title="View Scan Result"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No dangerous scans currently registered in the database.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
