"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Plus,
  Upload,
  Search,
  Trash2,
  RefreshCw,
  X,
  CheckCircle2,
  AlertTriangle,
  Play,
  FileText,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { DomainRule } from "@/types/database.types";

export default function AdminDomainRulesPage() {
  const [rules, setRules] = useState<DomainRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tabFilter, setTabFilter] = useState<"all" | "block" | "allow">("all");

  // Interactive Test Box State
  const [testInput, setTestInput] = useState("");
  const [testingEngine, setTestingEngine] = useState(false);
  const [testResult, setTestResult] = useState<{
    matched: boolean;
    ruleType: string | null;
    message: string;
  } | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Add Single Rule Form
  const [newDomain, setNewDomain] = useState("");
  const [newRuleType, setNewRuleType] = useState<"block" | "allow">("block");
  const [newNote, setNewNote] = useState("");

  // Bulk Import Form
  const [bulkCsvText, setBulkCsvText] = useState("");

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/domain-rules");
      if (!res.ok) throw new Error("Failed to load rules");
      const json = await res.json();
      setRules(json.rules || []);
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Error fetching rules",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/admin/domain-rules");
        if (!res.ok) throw new Error("Failed to load rules");
        const json = await res.json();
        if (!cancelled) {
          setRules(json.rules || []);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setFeedback({
            type: "error",
            message: err instanceof Error ? err.message : "Error fetching rules",
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
  }, []);

  const handleTestEngine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testInput.trim()) return;
    setTestingEngine(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/domain-rules/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: testInput.trim() }),
      });
      const json = await res.json();
      setTestResult(json);
    } catch {
      setTestResult({
        matched: false,
        ruleType: null,
        message: "Failed to evaluate rule engine test.",
      });
    } finally {
      setTestingEngine(false);
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;

    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/domain-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: newDomain.trim(),
          rule_type: newRuleType,
          note: newNote.trim(),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to add domain rule");
      }

      setFeedback({
        type: "success",
        message: `Successfully created ${newRuleType.toUpperCase()} rule for ${newDomain.trim()}.`,
      });

      setNewDomain("");
      setNewNote("");
      setShowAddModal(false);
      fetchRules();
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to add rule",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkCsvText.trim()) return;

    setActionLoading(true);
    setFeedback(null);
    try {
      const lines = bulkCsvText.split("\n");
      const parsedRules: Array<{ domain: string; rule_type: "block" | "allow"; note: string }> = [];

      for (const line of lines) {
        const parts = line.split(",").map((p) => p.trim());
        if (parts.length >= 2 && parts[0] && parts[1]) {
          const domain = parts[0];
          const rule_type = parts[1].toLowerCase() === "allow" ? "allow" : "block";
          const note = parts[2] || "Imported via bulk CSV";
          parsedRules.push({ domain, rule_type, note });
        }
      }

      if (parsedRules.length === 0) {
        throw new Error("No valid rows detected. Expected format: domain,block|allow,note");
      }

      const res = await fetch("/api/admin/domain-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: parsedRules }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to bulk import rules");
      }

      setFeedback({
        type: "success",
        message: `Successfully imported ${parsedRules.length} domain rules!`,
      });

      setBulkCsvText("");
      setShowBulkModal(false);
      fetchRules();
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Bulk import failed",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRule = async (ruleId: string, domain: string) => {
    if (!window.confirm(`Delete rule for "${domain}"?`)) return;

    try {
      const res = await fetch(`/api/admin/domain-rules?id=${ruleId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRules((prev) => prev.filter((r) => r.id !== ruleId));
        setFeedback({
          type: "success",
          message: `Rule for ${domain} was deleted.`,
        });
      }
    } catch (err) {
      console.error("Failed to delete rule:", err);
    }
  };

  const filteredRules = useMemo(() => {
    return rules.filter((r) => {
      const matchesTab = tabFilter === "all" || r.rule_type === tabFilter;
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.domain.toLowerCase().includes(q) ||
        (r.note && r.note.toLowerCase().includes(q));
      return matchesTab && matchesSearch;
    });
  }, [rules, tabFilter, search]);

  const blockCount = useMemo(() => rules.filter((r) => r.rule_type === "block").length, [rules]);
  const allowCount = useMemo(() => rules.filter((r) => r.rule_type === "allow").length, [rules]);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#1F2F3D] dark:text-[#F1F5F9] tracking-tight">
            Domain Rules Management
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Enforce custom blocklists and allowlists that override automated engine heuristics.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowBulkModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#16222E] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Bulk CSV Import</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0B5FFF] text-white text-xs font-bold hover:bg-[#0747C7] transition-all shadow-md shadow-blue-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Rule</span>
          </button>
        </div>
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

      {/* Test URL Against Rule Engine Box */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-[#0B5FFF]" />
            <h2 className="text-sm font-bold text-[#1F2F3D] dark:text-[#F1F5F9] uppercase tracking-wider">
              Test URL or Domain Against Engine
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">
            Simulate detection matching before deploying rules
          </span>
        </div>

        <form onSubmit={handleTestEngine} className="flex gap-2">
          <input
            type="text"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="e.g. login.phish-account.com or secure-bank.org/auth"
            className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0B5FFF]"
          />
          <button
            type="submit"
            disabled={testingEngine || !testInput.trim()}
            className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 dark:hover:bg-white transition-colors disabled:opacity-40 flex items-center gap-1.5 shrink-0"
          >
            {testingEngine && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>Evaluate</span>
          </button>
        </form>

        {testResult && (
          <div
            className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 ${
              testResult.matched
                ? testResult.ruleType === "block"
                  ? "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-900/60"
                  : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60"
                : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"
            }`}
          >
            {testResult.matched ? (
              testResult.ruleType === "block" ? (
                <ShieldAlert className="w-4 h-4 shrink-0 text-[#E5484D]" />
              ) : (
                <ShieldCheck className="w-4 h-4 shrink-0 text-[#22A559]" />
              )
            ) : (
              <FileText className="w-4 h-4 shrink-0 text-slate-400" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}
      </div>

      {/* Rules Navigation Bar (Tabs & Search) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl w-full sm:w-auto text-xs font-bold">
          <button
            onClick={() => setTabFilter("all")}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-xl transition-all ${
              tabFilter === "all"
                ? "bg-white dark:bg-[#16222E] text-[#1F2F3D] dark:text-[#F1F5F9] shadow-2xs"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            All Rules ({rules.length})
          </button>
          <button
            onClick={() => setTabFilter("block")}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              tabFilter === "block"
                ? "bg-white dark:bg-[#16222E] text-red-600 dark:text-red-400 shadow-2xs"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Blocklist ({blockCount})</span>
          </button>
          <button
            onClick={() => setTabFilter("allow")}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              tabFilter === "allow"
                ? "bg-white dark:bg-[#16222E] text-emerald-600 dark:text-emerald-400 shadow-2xs"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Allowlist ({allowCount})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rules…"
            className="w-full text-xs pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#16222E] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0B5FFF]"
          />
        </div>
      </div>

      {/* Rules Table */}
      <div className="rounded-3xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/40 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Domain / Hostname</th>
                <th className="py-3.5 px-4">Rule Policy</th>
                <th className="py-3.5 px-4">Operational Note</th>
                <th className="py-3.5 px-4">Added</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {loading && rules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#0B5FFF]" />
                      <span>Loading domain rules…</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No domain rules match your filter.
                  </td>
                </tr>
              ) : (
                filteredRules.map((r) => {
                  const isBlock = r.rule_type === "block";

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#1F2F3D] dark:text-[#F1F5F9]">
                        {r.domain}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isBlock
                              ? "bg-red-50 dark:bg-red-950/60 text-[#E5484D]"
                              : "bg-emerald-50 dark:bg-emerald-950/60 text-[#22A559]"
                          }`}
                        >
                          {isBlock ? (
                            <ShieldAlert className="w-3 h-3" />
                          ) : (
                            <ShieldCheck className="w-3 h-3" />
                          )}
                          <span>{isBlock ? "BLOCKLIST" : "ALLOWLIST"}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 max-w-sm truncate">
                        {r.note || "—"}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {formatDate(r.created_at)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteRule(r.id, r.domain)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="Delete rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Single Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-[#16222E] border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-[#1F2F3D] dark:text-[#F1F5F9]">
                Add Domain Rule
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRule} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Domain or Hostname
                </label>
                <input
                  type="text"
                  required
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="e.g. evil-phish.xyz or university.edu"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0B5FFF]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Rule Policy
                </label>
                <select
                  value={newRuleType}
                  onChange={(e) => setNewRuleType(e.target.value as "block" | "allow")}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0B5FFF]"
                >
                  <option value="block">BLOCK — Immediately flag as Dangerous</option>
                  <option value="allow">ALLOW — Exempt from threat warnings</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Operational Note
                </label>
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Reason, ticket ref, or campaign tag"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0B5FFF]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-[#0B5FFF] text-white font-bold hover:bg-[#0747C7] transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {actionLoading ? "Saving…" : "Save Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk CSV Import Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-[#16222E] border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-[#1F2F3D] dark:text-[#F1F5F9]">
                Bulk CSV Domain Import
              </h3>
              <button onClick={() => setShowBulkModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Paste CSV entries below, one per line. Format: <code className="font-mono text-[#0B5FFF]">domain,rule_type,note</code>
            </p>

            <form onSubmit={handleBulkImport} className="space-y-4 text-xs">
              <textarea
                rows={6}
                value={bulkCsvText}
                onChange={(e) => setBulkCsvText(e.target.value)}
                placeholder="bad-phish.net,block,Reported credential harvester&#10;trusted-partner.org,allow,Official campus partner"
                className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0B5FFF]"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !bulkCsvText.trim()}
                  className="px-4 py-2 rounded-xl bg-[#0B5FFF] text-white font-bold hover:bg-[#0747C7] transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {actionLoading ? "Importing…" : "Import Domains"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
