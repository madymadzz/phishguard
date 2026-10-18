"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database.types";
import {
  User,
  Shield,
  Moon,
  Sun,
  Monitor,
  Info,
  LogOut,
  Check,
  Loader2,
  AlertCircle,
  ExternalLink,
  Globe,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface ProfileClientProps {
  initialProfile: Profile | null;
  userEmail: string;
}

export function ProfileClient({ initialProfile, userEmail }: ProfileClientProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useLanguage();

  const [displayName, setDisplayName] = useState(
    initialProfile?.display_name || userEmail.split("@")[0] || ""
  );
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const isAdmin = initialProfile?.role === "admin";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialProfile) return;

    const trimmed = displayName.trim();
    if (trimmed.length < 2) {
      setNameError("Name must be at least 2 characters long.");
      return;
    }

    try {
      setSavingName(true);
      setNameError(null);
      setNameSaved(false);

      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: trimmed })
        .eq("id", initialProfile.id);

      if (error) {
        setNameError(error.message);
      } else {
        setNameSaved(true);
        setTimeout(() => setNameSaved(false), 3000);
        router.refresh();
      }
    } catch {
      setNameError("Failed to update name. Please try again.");
    } finally {
      setSavingName(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoggingOut(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  return (
    <div className="flex-1 px-5 py-6 space-y-6">
      {/* User Overview Card */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-3xl bg-[#EBF2FF] dark:bg-[#1E293B] border-2 border-blue-200 dark:border-blue-900/60 flex items-center justify-center text-[#0B5FFF] font-black text-xl mb-3 shadow-sm">
          {initials || <User className="w-7 h-7" />}
        </div>
        <h2 className="text-lg font-black text-[#1F2F3D] dark:text-[#F1F5F9]">
          {displayName || "PhishGuard User"}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
          {userEmail}
        </p>

        <div className="mt-3 flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
            {initialProfile?.status || "active"}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">
            {initialProfile?.role || "user"}
          </span>
        </div>
      </div>

      {/* Edit Display Name */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Personal Information
        </h3>

        <form onSubmit={handleUpdateName} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your Name"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1E293B] text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
            />
          </div>

          {nameError && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{nameError}</span>
            </div>
          )}

          {nameSaved && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>Display name updated successfully!</span>
            </div>
          )}

          <button
            type="submit"
            disabled={savingName}
            className="w-full py-2.5 px-4 bg-[#0B5FFF] hover:bg-blue-600 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
          >
            {savingName ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving…</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </form>
      </div>

      {/* Theme Preference */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Appearance
        </h3>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-2 transition-all cursor-pointer ${
              theme === "light"
                ? "border-[#0B5FFF] bg-[#EBF2FF] text-[#0B5FFF] dark:bg-blue-950/40 font-bold"
                : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Sun className="w-5 h-5" />
            <span>Light</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-2 transition-all cursor-pointer ${
              theme === "dark"
                ? "border-[#0B5FFF] bg-[#1E293B] text-blue-400 font-bold"
                : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Moon className="w-5 h-5" />
            <span>Dark</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme("system")}
            className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-2 transition-all cursor-pointer ${
              theme === "system"
                ? "border-[#0B5FFF] bg-[#EBF2FF] text-[#0B5FFF] dark:bg-blue-950/40 font-bold"
                : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Monitor className="w-5 h-5" />
            <span>Auto</span>
          </button>
        </div>
      </div>

      {/* Language Preference */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" />
          <span>{t("profile", "language")}</span>
        </h3>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setLocale("en")}
            className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              locale === "en"
                ? "border-[#0B5FFF] bg-[#EBF2FF] text-[#0B5FFF] dark:bg-blue-950/40 font-bold"
                : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <span>English (EN)</span>
          </button>

          <button
            type="button"
            onClick={() => setLocale("fil")}
            className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              locale === "fil"
                ? "border-[#0B5FFF] bg-[#EBF2FF] text-[#0B5FFF] dark:bg-blue-950/40 font-bold"
                : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <span>Filipino (FIL)</span>
          </button>
        </div>
      </div>

      {/* Admin Panel Link (if role === admin) */}
      {isAdmin && (
        <div className="p-5 rounded-3xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 space-y-2">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-xs uppercase tracking-wide">
            <Shield className="w-4 h-4" />
            <span>Administrator Access</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300">
            You hold admin credentials. Manage users, domain allow/block lists, reports, and system settings.
          </p>
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center justify-between w-full mt-2 p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <span>Open Admin Panel</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* About & Information Navigation */}
      <div className="p-3.5 rounded-3xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
        <Link
          href="/about"
          className="p-3 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-[#0B5FFF] dark:hover:text-[#0B5FFF] transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-[#0B5FFF]" />
            <span>About PhishGuard & Limitations</span>
          </div>
          <span className="text-slate-400">›</span>
        </Link>
      </div>

      {/* Sign Out Button */}
      <button
        onClick={handleSignOut}
        disabled={loggingOut}
        className="w-full p-3.5 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-2 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-all cursor-pointer disabled:opacity-50"
      >
        {loggingOut ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <LogOut className="w-4 h-4" />
        )}
        <span>Sign Out of PhishGuard</span>
      </button>
    </div>
  );
}
