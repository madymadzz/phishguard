"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ClipboardList,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { AuditLog } from "@/types/database.types";

interface AuditLogWithActor extends AuditLog {
  profiles?: {
    email?: string;
    display_name?: string;
  };
}

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLogWithActor[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = useCallback(
    async (targetPage = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(targetPage));
        params.set("limit", "25");
        if (search) params.set("search", search);
        if (actionFilter !== "all") params.set("action", actionFilter);

        const res = await fetch(`/api/admin/audit-log?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load audit logs");
        const json = await res.json();
        setLogs(json.logs || []);
        setTotal(json.total || 0);
        setPage(json.page || 1);
      } catch (err) {
        console.error("Error fetching audit logs:", err);
      } finally {
        setLoading(false);
      }
    },
    [search, actionFilter]
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const params = new URLSearchParams();
        params.set("page", "1");
        params.set("limit", "25");
        if (search) params.set("search", search);
        if (actionFilter !== "all") params.set("action", actionFilter);

        const res = await fetch(`/api/admin/audit-log?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load audit logs");
        const json = await res.json();
        if (!cancelled) {
          setLogs(json.logs || []);
          setTotal(json.total || 0);
          setPage(json.page || 1);
        }
      } catch (err) {
        console.error("Error loading audit logs:", err);
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
  }, [search, actionFilter]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const totalPages = Math.max(1, Math.ceil(total / 25));

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#1F2F3D] dark:text-[#F1F5F9] tracking-tight">
            Security Audit Trail
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Immutable, append-only chronological history of administrative operations and system mutations.
          </p>
        </div>

        <button
          onClick={() => fetchLogs(page)}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#16222E] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#0B5FFF]" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit trail by action, resource type, or actor…"
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0B5FFF]"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="text-xs py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#0B5FFF] w-full md:w-auto font-bold"
        >
          <option value="all">All Actions</option>
          <option value="user_profile_updated">User Profile Updated</option>
          <option value="user_account_deleted">User Deleted</option>
          <option value="domain_rules_created">Domain Rules Created</option>
          <option value="domain_rule_deleted">Domain Rule Deleted</option>
          <option value="report_status_updated">Report Status Updated</option>
          <option value="learn_article_created">Article Created</option>
          <option value="learn_article_updated">Article Updated</option>
          <option value="learn_article_deleted">Article Deleted</option>
          <option value="app_settings_updated">Settings Updated</option>
          <option value="provider_diagnostics_tested">Diagnostics Run</option>
          <option value="scan_record_deleted">Scan Deleted</option>
        </select>
      </div>

      {/* Audit Log Timeline / Table */}
      <div className="rounded-3xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {loading && logs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#0B5FFF]" />
              <span>Loading audit logs…</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <ClipboardList className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-[#1F2F3D] dark:text-[#F1F5F9]">
                No Audit Events Recorded Yet
              </h3>
              <p className="text-xs text-slate-400">
                Administrative mutations will appear here chronologically as you manage users, rules, and settings.
              </p>
            </div>
          ) : (
            logs.map((log) => {
              const isExpanded = expandedId === log.id;
              const formattedTime = new Date(log.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              });

              return (
                <div key={log.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <div
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer"
                    onClick={() => toggleExpand(log.id)}
                  >
                    {/* Left: Action badge & actor */}
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#0B5FFF] font-mono text-[11px] font-black uppercase tracking-wider">
                        {log.action}
                      </span>

                      <div className="text-xs">
                        <span className="font-bold text-[#1F2F3D] dark:text-[#F1F5F9]">
                          {log.profiles?.email || "System / Service Role"}
                        </span>
                        {log.target_type && (
                          <span className="text-slate-400 text-[11px] ml-1.5">
                            target: <span className="font-mono text-slate-600 dark:text-slate-300">{log.target_type}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Timestamp & expand chevron */}
                    <div className="flex items-center gap-3 text-slate-400 text-[11px] shrink-0">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDate(log.created_at)} {formattedTime}</span>
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>

                  {/* Expandable JSON Metadata Inspector */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Event Metadata Payload
                      </div>
                      <pre className="p-3 rounded-2xl bg-slate-900 text-slate-100 text-[10px] font-mono overflow-x-auto max-h-56 border border-slate-800">
                        {JSON.stringify(
                          {
                            logId: log.id,
                            actorId: log.actor_id,
                            action: log.action,
                            targetType: log.target_type,
                            targetId: log.target_id,
                            metadata: log.metadata,
                            timestamp: log.created_at,
                          },
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Bar */}
        {total > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {logs.length} of {total} audit records
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchLogs(page - 1)}
                disabled={page <= 1 || loading}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => fetchLogs(page + 1)}
                disabled={page >= totalPages || loading}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
