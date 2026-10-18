"use client";

import React, { useState } from "react";
import { Flag, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface ReportModalProps {
  scanId: string;
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_REASONS = [
  "This is a legitimate, safe website (False Positive)",
  "This is an active phishing scam or malware (False Negative)",
  "The link preview or redirect chain is incorrect",
  "Other issues or misclassification",
];

export function ReportWrongResultModal({ scanId, isOpen, onClose }: ReportModalProps) {
  const [selectedPreset, setSelectedPreset] = useState(PRESET_REASONS[0]);
  const [customNote, setCustomNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const fullReason = customNote.trim()
      ? `${selectedPreset}: ${customNote.trim()}`
      : selectedPreset;

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scan_id: scanId,
          reason: fullReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit report.");
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1800);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Error submitting report.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-[#16222E] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950/50 text-[#E5484D] flex items-center justify-center">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1F2F3D] dark:text-[#F1F5F9]">
                Report Wrong Result
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Help improve PhishGuard detection accuracy
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-[#22A559] animate-bounce" />
            <h3 className="text-sm font-bold text-[#1F2F3D] dark:text-[#F1F5F9]">
              Feedback Received
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
              Thank you! Our security team will review this classification to tune our heuristics.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#1F2F3D] dark:text-[#F1F5F9]">
                What is the issue with this verdict?
              </label>
              <div className="space-y-2">
                {PRESET_REASONS.map((preset) => (
                  <label
                    key={preset}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer text-xs transition-colors ${
                      selectedPreset === preset
                        ? "border-[#0B5FFF] bg-blue-50/50 dark:bg-blue-950/40 text-[#0B5FFF] font-semibold"
                        : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="preset"
                      value={preset}
                      checked={selectedPreset === preset}
                      onChange={() => setSelectedPreset(preset)}
                      className="mt-0.5 text-[#0B5FFF] focus:ring-[#0B5FFF]"
                    />
                    <span>{preset}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Additional context (optional)
              </label>
              <textarea
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="e.g. This is the official school portal used by TIP students..."
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0E1620] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0B5FFF]"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#0B5FFF] text-white text-xs font-bold shadow-md shadow-[#0B5FFF]/20 hover:bg-[#0A53DE] disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting…</span>
                  </>
                ) : (
                  <span>Submit Report</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
