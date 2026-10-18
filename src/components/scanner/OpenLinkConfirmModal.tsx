"use client";

import React from "react";
import { AlertTriangle, ShieldCheck, ExternalLink, X } from "lucide-react";

interface OpenLinkConfirmProps {
  url: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function OpenLinkConfirmModal({ url, isOpen, onClose, onConfirm }: OpenLinkConfirmProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-[#16222E] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-red-100 dark:border-red-950/50 space-y-4 animate-in slide-in-from-bottom duration-300"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-[#E5484D] flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-base font-black text-[#1F2F3D] dark:text-[#F1F5F9]">
            Warning: High Security Risk
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            PhishGuard identified suspicious or malicious characteristics associated with this destination. Opening it may expose your personal information, credentials, or device.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 break-all text-[11px] font-mono text-slate-700 dark:text-slate-300">
          {url}
        </div>

        <div className="pt-2 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl bg-[#0B5FFF] text-white text-xs font-bold shadow-md shadow-[#0B5FFF]/20 hover:bg-[#0A53DE] transition-colors flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Stay Safe (Recommended)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center justify-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>I understand the risk, open link</span>
          </button>
        </div>
      </div>
    </div>
  );
}
