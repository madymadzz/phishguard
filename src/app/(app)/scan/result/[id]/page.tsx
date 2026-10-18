"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/layout/BottomNav";
import { RiskMeter } from "@/components/scanner/RiskMeter";
import { ReportWrongResultModal } from "@/components/scanner/ReportWrongResultModal";
import { OpenLinkConfirmModal } from "@/components/scanner/OpenLinkConfirmModal";
import { createClient } from "@/lib/supabase/client";
import { defangUrl } from "@/lib/detection/normalize";
import type { Scan, ReasonItem } from "@/types/database.types";
import {
  ArrowLeft,
  Share2,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  RotateCcw,
  Flag,
  ChevronDown,
  ChevronUp,
  Info,
  GitCommit,
  Globe,
} from "lucide-react";

export default function ScanResultPage() {
  const params = useParams();
  const router = useRouter();
  const scanId = params.id as string;

  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);
  const [showRedirectChain, setShowRedirectChain] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isOpenLinkConfirmOpen, setIsOpenLinkConfirmOpen] = useState(false);

  useEffect(() => {
    async function loadScan() {
      try {
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from("scans")
          .select("*")
          .eq("id", scanId)
          .single();

        if (fetchError || !data) {
          setError("Scan record not found or access denied.");
        } else {
          setScan(data as unknown as Scan);
        }
      } catch (err) {
        setError("Failed to load scan record.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (scanId) {
      loadScan();
    }
  }, [scanId]);

  // Copy defanged URL to clipboard
  async function handleCopyDefanged() {
    if (!scan?.final_url) return;
    const defanged = defangUrl(scan.final_url);
    try {
      await navigator.clipboard.writeText(defanged);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }

  // Web Share or Copy Link
  async function handleShare() {
    if (!scan) return;
    const shareTitle = `PhishGuard Scan: ${scan.risk_level.toUpperCase()} (${scan.hostname})`;
    const shareText = `PhishGuard threat analysis for ${defangUrl(scan.final_url || scan.input_value)}: Risk score is ${scan.risk_score}/100.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: window.location.href,
        });
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert("Scan result link copied to clipboard!");
    }
  }

  function handleOpenLinkAction() {
    if (!scan?.final_url) return;

    if (scan.risk_level === "safe") {
      window.open(scan.final_url, "_blank", "noopener,noreferrer");
    } else {
      setIsOpenLinkConfirmOpen(true);
    }
  }

  function handleConfirmDangerousOpen() {
    if (scan?.final_url) {
      window.open(scan.final_url, "_blank", "noopener,noreferrer");
    }
  }

  if (loading) {
    return (
      <AppShell showHeader={true} headerContent={<HeaderBack />} footerContent={<BottomNav />}>
        <div className="flex-1 p-5 space-y-4">
          <div className="h-44 rounded-3xl bg-white dark:bg-[#16222E] animate-pulse" />
          <div className="h-28 rounded-2xl bg-white dark:bg-[#16222E] animate-pulse" />
          <div className="h-48 rounded-2xl bg-white dark:bg-[#16222E] animate-pulse" />
        </div>
      </AppShell>
    );
  }

  if (error || !scan) {
    return (
      <AppShell showHeader={true} headerContent={<HeaderBack />} footerContent={<BottomNav />}>
        <div className="flex-1 px-5 py-12 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 text-[#E5484D] flex items-center justify-center">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-[#1F2F3D] dark:text-[#F1F5F9]">
            Unable to Load Scan
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
            {error || "The scan result could not be retrieved from your account history."}
          </p>
          <Link
            href="/scan/url"
            className="py-2.5 px-4 bg-[#0B5FFF] text-white text-xs font-bold rounded-xl"
          >
            Start New Scan
          </Link>
        </div>
      </AppShell>
    );
  }

  const isDangerous = scan.risk_level === "dangerous";
  const isSuspicious = scan.risk_level === "suspicious";

  // Card theme styling
  let cardTheme = {
    bg: "from-[#22A559]/10 via-[#22A559]/5 to-transparent border-[#22A559]/30",
    badgeBg: "bg-[#E6F6EC] dark:bg-[#0E3820] text-[#22A559] dark:text-[#4ADE80] border-[#22A559]/30",
    iconBg: "bg-[#22A559] text-white",
    label: "SAFE DESTINATION",
    subtext: "No phishing indicators or malicious signatures detected.",
    Icon: ShieldCheck,
  };

  if (isDangerous) {
    cardTheme = {
      bg: "from-[#E5484D]/15 via-[#E5484D]/5 to-transparent border-[#E5484D]/30",
      badgeBg: "bg-[#FDECEC] dark:bg-[#431418] text-[#E5484D] dark:text-[#F87171] border-[#E5484D]/30",
      iconBg: "bg-[#E5484D] text-white",
      label: "HIGH RISK — THREAT DETECTED",
      subtext: "Strong indicators of phishing or malicious activity identified.",
      Icon: ShieldAlert,
    };
  } else if (isSuspicious) {
    cardTheme = {
      bg: "from-[#F59E0B]/15 via-[#F59E0B]/5 to-transparent border-[#F59E0B]/30",
      badgeBg: "bg-[#FEF3DC] dark:bg-[#451A03] text-[#D97706] dark:text-[#FBBF24] border-[#F59E0B]/30",
      iconBg: "bg-[#F59E0B] text-white",
      label: "SUSPICIOUS DESTINATION",
      subtext: "Unusual patterns flagged. Exercise extra caution before proceeding.",
      Icon: AlertTriangle,
    };
  }

  const VerdictIcon = cardTheme.Icon;
  const redirectHops = (scan.redirect_chain || []) as string[];
  const reasons = (scan.reasons || []) as ReasonItem[];
  const aiExplanation = scan.ai_explanation || {};
  const defangedDisplay = defangUrl(scan.final_url || scan.input_value);

  return (
    <AppShell
      showHeader={true}
      headerContent={
        <div className="w-full flex items-center justify-between">
          <button
            onClick={() => router.push("/scan/url")}
            className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Back to scanner"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold text-[#1F2F3D] dark:text-[#F1F5F9]">
            Scan Verdict
          </span>
          <button
            onClick={handleShare}
            className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Share scan result"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      }
      footerContent={<BottomNav />}
    >
      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Large Verdict Card */}
        <div
          className={`w-full rounded-3xl p-5 bg-gradient-to-b ${cardTheme.bg} bg-white dark:bg-[#16222E] border shadow-sm space-y-3.5`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl ${cardTheme.iconBg} flex items-center justify-center shadow-md`}
            >
              <VerdictIcon className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span
                className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border mb-1 ${cardTheme.badgeBg}`}
              >
                {cardTheme.label}
              </span>
              <h1 className="text-sm font-bold text-[#1F2F3D] dark:text-[#F1F5F9] leading-snug">
                {cardTheme.subtext}
              </h1>
            </div>
          </div>
        </div>

        {/* Risk Meter */}
        <RiskMeter score={scan.risk_score} riskLevel={scan.risk_level} />

        {/* Final Destination Card */}
        <div className="w-full bg-white dark:bg-[#16222E] rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
              <Globe className="w-3.5 h-3.5 text-[#0B5FFF]" />
              <span>Final Destination</span>
            </div>
            <button
              onClick={handleCopyDefanged}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] font-bold transition-colors"
              title="Copy defanged link"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-[#22A559]" />
                  <span className="text-[#22A559]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Defanged</span>
                </>
              )}
            </button>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0E1620] border border-slate-200/80 dark:border-slate-800 break-all font-mono text-[11px] text-slate-800 dark:text-slate-200">
            {defangedDisplay}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
            <span>Domain: <strong className="text-slate-700 dark:text-slate-300">{scan.hostname}</strong></span>
            <span>Type: {scan.source.toUpperCase()}</span>
          </div>
        </div>

        {/* Redirect Chain Accordion */}
        {redirectHops.length > 1 && (
          <div className="w-full bg-white dark:bg-[#16222E] rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
            <button
              onClick={() => setShowRedirectChain(!showRedirectChain)}
              className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-[#0B5FFF]" />
                <span className="text-xs font-bold text-[#1F2F3D] dark:text-[#F1F5F9]">
                  Redirect Chain ({redirectHops.length} hops)
                </span>
              </div>
              {showRedirectChain ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showRedirectChain && (
              <div className="px-3.5 pb-3.5 pt-1 space-y-2 border-t border-slate-100 dark:border-slate-800">
                {redirectHops.map((hop, index) => (
                  <div key={index} className="flex items-start gap-2 text-[11px] font-mono">
                    <span className="w-4 text-slate-400 font-bold shrink-0">{index + 1}.</span>
                    <span className="text-slate-600 dark:text-slate-400 break-all">
                      {defangUrl(hop)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI-Assisted Explanation Card */}
        <div className="w-full bg-gradient-to-br from-blue-50/70 via-white to-blue-50/40 dark:from-blue-950/40 dark:via-[#16222E] dark:to-blue-950/20 rounded-2xl p-4 border border-blue-100 dark:border-blue-900/50 shadow-sm space-y-2.5">
          <div className="flex items-center gap-1.5 text-[#0B5FFF]">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span className="text-xs font-extrabold uppercase tracking-wider">
              AI Security Explanation
            </span>
          </div>

          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            {aiExplanation.summary ||
              "Link analysis synthesized based on structural heuristics and security intelligence feeds."}
          </p>

          {aiExplanation.bullets && aiExplanation.bullets.length > 0 && (
            <ul className="space-y-1.5 pt-1">
              {aiExplanation.bullets.map((bullet, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-400 leading-normal"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0B5FFF] mt-1.5 shrink-0" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Heuristic Reasons List */}
        <div className="space-y-2 pt-1">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
            Triggered Security Signals ({reasons.length})
          </h2>

          <div className="space-y-2">
            {reasons.length === 0 ? (
              <div className="p-3 bg-white dark:bg-[#16222E] rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-500" />
                <span>No negative heuristics or blacklist hits detected.</span>
              </div>
            ) : (
              reasons.map((reason, index) => {
                const isDangerSev = reason.severity === "danger";
                const isWarnSev = reason.severity === "warn";

                const chipClass = isDangerSev
                  ? "bg-red-50 dark:bg-red-950/50 text-[#E5484D] border-red-200/50"
                  : isWarnSev
                  ? "bg-amber-50 dark:bg-amber-950/50 text-[#D97706] border-amber-200/50"
                  : "bg-blue-50 dark:bg-blue-950/50 text-[#0B5FFF] border-blue-200/50";

                return (
                  <div
                    key={index}
                    className="p-3 rounded-2xl bg-white dark:bg-[#16222E] border border-slate-100 dark:border-slate-800 shadow-2xs space-y-1"
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border ${chipClass}`}
                      >
                        {reason.severity}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {reason.code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
                      {reason.message}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Mandatory Disclaimer */}
        <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed text-center">
          ⚠️ <em>PhishGuard gives a risk indication and cannot guarantee 100% detection. Always exercise personal caution before sharing sensitive credentials or one-time pins.</em>
        </div>

        {/* Primary Action Buttons */}
        <div className="space-y-2.5 pt-2">
          {/* Open Link Button or Non-Web Link Indicator */}
          {scan.final_url ? (
            <button
              onClick={handleOpenLinkAction}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
                isDangerous
                  ? "bg-red-600/10 hover:bg-red-600/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50"
                  : isSuspicious
                  ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
              }`}
            >
              <ExternalLink className="w-4 h-4" />
              <span>
                {isDangerous
                  ? "Open Dangerous Link (Caution)"
                  : isSuspicious
                  ? "Open Suspicious Link (Caution)"
                  : "Open Verified Link"}
              </span>
            </button>
          ) : (
            <div className="w-full py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 text-center flex items-center justify-center gap-2">
              <Info className="w-4 h-4 text-[#0B5FFF]" />
              <span>Not a Web Link — Local Device Action</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Scan Again */}
            <Link
              href="/scan/url"
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#0B5FFF] text-white text-xs font-bold shadow-md shadow-[#0B5FFF]/20 hover:bg-[#0A53DE] transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Scan Again</span>
            </Link>

            {/* Report Wrong Result */}
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <Flag className="w-3.5 h-3.5 text-slate-400" />
              <span>Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ReportWrongResultModal
        scanId={scan.id}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

      <OpenLinkConfirmModal
        url={scan.final_url || scan.input_value}
        isOpen={isOpenLinkConfirmOpen}
        onClose={() => setIsOpenLinkConfirmOpen(false)}
        onConfirm={handleConfirmDangerousOpen}
      />
    </AppShell>
  );
}

function HeaderBack() {
  const router = useRouter();
  return (
    <div className="w-full flex items-center justify-between">
      <button
        onClick={() => router.push("/scan/url")}
        className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <span className="text-sm font-bold text-[#1F2F3D] dark:text-[#F1F5F9]">
        Scan Result
      </span>
      <div className="w-8" />
    </div>
  );
}
