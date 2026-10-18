import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/layout/BottomNav";
import { Logo } from "@/components/ui/logo";
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  Lock,
  Cpu,
  QrCode,
  Link as LinkIcon,
  HelpCircle,
  GraduationCap,
} from "lucide-react";

export default function AboutPage() {
  return (
    <AppShell
      showHeader={true}
      headerContent={
        <div className="w-full flex items-center justify-between">
          <Link
            href="/home"
            className="p-1 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="text-sm font-bold text-[#1F2F3D] dark:text-[#F1F5F9]">
            About PhishGuard
          </span>
          <div className="w-5" />
        </div>
      }
      footerContent={<BottomNav />}
    >
      <div className="flex-1 px-5 py-6 space-y-6">
        {/* Brand Banner */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 text-center flex flex-col items-center">
          <Logo size="lg" showWordmark={true} showTagline={true} className="mb-4" />
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-xs">
            An intelligent, mobile-first phishing and deceptive link defense system designed specifically for students and everyday internet users.
          </p>
        </div>

        {/* Purpose & Mission */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0B5FFF]">
            <Shield className="w-4 h-4" />
            <span>Our Purpose</span>
          </div>
          <h2 className="text-sm font-bold text-[#1F2F3D] dark:text-[#F1F5F9]">
            Protecting Mobile Users from Digital Traps
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Phishing attacks, deceptive SMS alerts (smishing), and fraudulent QR codes (quishing) exploit human trust and small mobile screens. PhishGuard acts as your digital shield, analyzing links before your browser ever opens them.
          </p>
        </div>

        {/* Key Features */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
            Core Capabilities
          </h3>

          <div className="grid grid-cols-1 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0B5FFF] flex items-center justify-center shrink-0 mt-0.5">
                <LinkIcon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#1F2F3D] dark:text-[#F1F5F9]">
                  Deterministic Link Analysis
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Safely unshortens redirect chains, checks punycode spoofing, typosquatting against major Philippine & global brands, and queries Google Safe Browsing and URLhaus.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#1F2F3D] dark:text-[#F1F5F9]">
                  QR Code Viewfinder & Gallery
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Scans physical QR stickers with camera flash assistance, handles photo gallery imports, and safely unpacks Wi-Fi, phone, and payment deep-links.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#1F2F3D] dark:text-[#F1F5F9]">
                  AI-Powered Explanations
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Translates complex security metrics into plain, student-friendly bullet points with zero technical jargon.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How to Use Guide */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            <HelpCircle className="w-4 h-4 text-[#0B5FFF]" />
            <span>How to Use PhishGuard</span>
          </div>

          <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#EBF2FF] dark:bg-[#1E293B] text-[#0B5FFF] font-bold text-[11px] flex items-center justify-center shrink-0">
                1
              </span>
              <span><strong>Paste or Scan:</strong> Copy any suspicious link from SMS or Messenger into URL Scanner, or point your camera at a QR code.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#EBF2FF] dark:bg-[#1E293B] text-[#0B5FFF] font-bold text-[11px] flex items-center justify-center shrink-0">
                2
              </span>
              <span><strong>Review Risk Verdict:</strong> View the risk level (SAFE, SUSPICIOUS, or HIGH RISK), risk meter score (0–100), and plain-language indicators.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#EBF2FF] dark:bg-[#1E293B] text-[#0B5FFF] font-bold text-[11px] flex items-center justify-center shrink-0">
                3
              </span>
              <span><strong>Inspect Final Destination:</strong> Verify the defanged URL and redirect hops before making any decision to open.</span>
            </div>
          </div>
        </div>

        {/* Mandatory Limitation Statement */}
        <div className="p-4 rounded-3xl bg-amber-50 dark:bg-[#231A0A] border border-amber-200/90 dark:border-amber-900/60 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wide">
              Important Limitation Statement
            </h4>
            <p className="text-[11px] text-amber-800/90 dark:text-amber-200/80 leading-relaxed">
              PhishGuard gives a risk indication and <strong>does not guarantee 100% detection</strong>. Sophisticated or zero-hour phishing attacks may temporarily evade automated feeds. Always exercise personal caution and never share OTPs or passwords.
            </p>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="p-4 rounded-3xl bg-slate-50 dark:bg-[#131B24] border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
          <Lock className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Privacy & Data Protection
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Scans are private to your user account. Platform administrators can only review reported links for moderation. URL query strings and user account identities are never sent to external AI services.
            </p>
          </div>
        </div>

        {/* Project & Team Credit */}
        <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-[#111C2B] dark:to-[#171E2E] border border-blue-100 dark:border-slate-800 text-center space-y-1.5">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#0B5FFF] dark:text-blue-400 uppercase tracking-wider">
            <GraduationCap className="w-4 h-4" />
            <span>Academic Project</span>
          </div>
          <p className="text-xs font-bold text-[#1F2F3D] dark:text-[#F1F5F9]">
            PhishGuard — Entrepreneurial Management Project
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Technological Institute of the Philippines (TIP) Quezon City
          </p>
        </div>
      </div>
    </AppShell>
  );
}
