"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Save,
  Server,
  Lock,
} from "lucide-react";

interface AppSettingsState {
  maintenance_mode: boolean;
  registration_open: boolean;
  ai_explanations_enabled: boolean;
  safe_browsing_enabled: boolean;
  urlhaus_enabled: boolean;
  virustotal_enabled: boolean;
  disclaimer_text: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AppSettingsState>({
    maintenance_mode: false,
    registration_open: true,
    ai_explanations_enabled: true,
    safe_browsing_enabled: true,
    urlhaus_enabled: true,
    virustotal_enabled: false,
    disclaimer_text: "PhishGuard gives a risk indication and does not guarantee 100% detection.",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error("Failed to load settings");
      const json = await res.json();
      if (json.settings) {
        setSettings({
          maintenance_mode: Boolean(json.settings.maintenance_mode),
          registration_open: Boolean(json.settings.registration_open ?? true),
          ai_explanations_enabled: Boolean(json.settings.ai_explanations_enabled ?? true),
          safe_browsing_enabled: Boolean(json.settings.safe_browsing_enabled ?? true),
          urlhaus_enabled: Boolean(json.settings.urlhaus_enabled ?? true),
          virustotal_enabled: Boolean(json.settings.virustotal_enabled ?? false),
          disclaimer_text:
            String(json.settings.disclaimer_text || "") ||
            "PhishGuard gives a risk indication and does not guarantee 100% detection.",
        });
      }
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Error loading settings",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/admin/settings");
        if (!res.ok) throw new Error("Failed to load settings");
        const json = await res.json();
        if (!cancelled && json.settings) {
          setSettings({
            maintenance_mode: Boolean(json.settings.maintenance_mode),
            registration_open: Boolean(json.settings.registration_open ?? true),
            ai_explanations_enabled: Boolean(json.settings.ai_explanations_enabled ?? true),
            safe_browsing_enabled: Boolean(json.settings.safe_browsing_enabled ?? true),
            urlhaus_enabled: Boolean(json.settings.urlhaus_enabled ?? true),
            virustotal_enabled: Boolean(json.settings.virustotal_enabled ?? false),
            disclaimer_text:
              String(json.settings.disclaimer_text || "") ||
              "PhishGuard gives a risk indication and does not guarantee 100% detection.",
          });
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setFeedback({
            type: "error",
            message: err instanceof Error ? err.message : "Error loading settings",
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

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save settings");
      }

      setFeedback({
        type: "success",
        message: "Platform settings updated and logged to audit trail.",
      });
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Save failed",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#1F2F3D] dark:text-[#F1F5F9] tracking-tight">
            Platform Settings & Feature Flags
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Toggle global detection engine switches, registration gates, and maintenance states.
          </p>
        </div>

        <button
          onClick={fetchSettings}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#16222E] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs disabled:opacity-50"
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
        </div>
      )}

      {/* Maintenance Mode Warning Card */}
      {settings.maintenance_mode && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold block">Maintenance Mode is currently ACTIVE</span>
            <span>All non-admin users visiting the application will be redirected to the maintenance notice screen.</span>
          </div>
        </div>
      )}

      {/* Form Settings */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Core Access Switches */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-[#1F2F3D] dark:text-[#F1F5F9] uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#0B5FFF]" />
            <span>Platform Availability & Access</span>
          </h2>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {/* Maintenance Mode Toggle */}
            <div className="py-3.5 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-[#1F2F3D] dark:text-[#F1F5F9]">
                  Maintenance Mode
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Temporarily lock out regular users while running system updates or database migrations.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.maintenance_mode}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, maintenance_mode: e.target.checked }))
                }
                className="w-5 h-5 rounded border-slate-300 text-[#0B5FFF] focus:ring-[#0B5FFF]"
              />
            </div>

            {/* Registration Open Toggle */}
            <div className="py-3.5 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-[#1F2F3D] dark:text-[#F1F5F9]">
                  User Registration Open
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Allow new students and users to create PhishGuard accounts via the signup page.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.registration_open}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, registration_open: e.target.checked }))
                }
                className="w-5 h-5 rounded border-slate-300 text-[#0B5FFF] focus:ring-[#0B5FFF]"
              />
            </div>
          </div>
        </div>

        {/* Threat Intelligence & AI Engines */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-[#1F2F3D] dark:text-[#F1F5F9] uppercase tracking-wider flex items-center gap-2">
            <Server className="w-4 h-4 text-[#0B5FFF]" />
            <span>Detection Providers & AI Engine</span>
          </h2>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {/* Gemini AI Explanations */}
            <div className="py-3.5 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-[#1F2F3D] dark:text-[#F1F5F9] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Google Gemini AI Explanations</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Generate plain-language risk breakdowns using Gemini 3.8 Flash with heuristic fallback.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.ai_explanations_enabled}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, ai_explanations_enabled: e.target.checked }))
                }
                className="w-5 h-5 rounded border-slate-300 text-[#0B5FFF] focus:ring-[#0B5FFF]"
              />
            </div>

            {/* Google Safe Browsing */}
            <div className="py-3.5 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-[#1F2F3D] dark:text-[#F1F5F9]">
                  Google Safe Browsing v4
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Lookup live reputation for malware, phishing, and unwanted software distributions.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.safe_browsing_enabled}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, safe_browsing_enabled: e.target.checked }))
                }
                className="w-5 h-5 rounded border-slate-300 text-[#0B5FFF] focus:ring-[#0B5FFF]"
              />
            </div>

            {/* abuse.ch URLhaus */}
            <div className="py-3.5 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-[#1F2F3D] dark:text-[#F1F5F9]">
                  abuse.ch URLhaus Intelligence
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Check against active community-reported malware and malicious redirectors.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.urlhaus_enabled}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, urlhaus_enabled: e.target.checked }))
                }
                className="w-5 h-5 rounded border-slate-300 text-[#0B5FFF] focus:ring-[#0B5FFF]"
              />
            </div>

            {/* VirusTotal */}
            <div className="py-3.5 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-[#1F2F3D] dark:text-[#F1F5F9]">
                  VirusTotal API (Optional)
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Secondary aggregator API check (leave disabled if no key configured).
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.virustotal_enabled}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, virustotal_enabled: e.target.checked }))
                }
                className="w-5 h-5 rounded border-slate-300 text-[#0B5FFF] focus:ring-[#0B5FFF]"
              />
            </div>
          </div>
        </div>

        {/* Global Limitation & Disclaimer Copy */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
          <h2 className="text-sm font-bold text-[#1F2F3D] dark:text-[#F1F5F9] uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#0B5FFF]" />
            <span>Mandatory Standing Disclaimer Copy</span>
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Displayed across the URL/QR Scan Result screens and the About section.
          </p>

          <textarea
            rows={3}
            value={settings.disclaimer_text}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, disclaimer_text: e.target.value }))
            }
            className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0B5FFF]"
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0B5FFF] text-white text-xs font-bold hover:bg-[#0747C7] transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? "Saving Platform Configuration…" : "Save Platform Configuration"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
