"use client";

import React from "react";
import type { RiskLevel } from "@/types/database.types";
import { ShieldCheck, AlertTriangle, ShieldAlert } from "lucide-react";

interface RiskMeterProps {
  score: number;
  riskLevel: RiskLevel;
}

export function RiskMeter({ score, riskLevel }: RiskMeterProps) {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));

  let colorClasses = {
    bar: "bg-[#22A559]",
    badgeBg: "bg-[#E6F6EC] dark:bg-[#0E3820]",
    badgeText: "text-[#22A559] dark:text-[#4ADE80]",
    border: "border-[#22A559]/30",
    label: "SAFE",
    icon: ShieldCheck,
  };

  if (riskLevel === "dangerous" || clampedScore >= 65) {
    colorClasses = {
      bar: "bg-[#E5484D]",
      badgeBg: "bg-[#FDECEC] dark:bg-[#431418]",
      badgeText: "text-[#E5484D] dark:text-[#F87171]",
      border: "border-[#E5484D]/30",
      label: "HIGH RISK",
      icon: ShieldAlert,
    };
  } else if (riskLevel === "suspicious" || clampedScore >= 30) {
    colorClasses = {
      bar: "bg-[#F59E0B]",
      badgeBg: "bg-[#FEF3DC] dark:bg-[#451A03]",
      badgeText: "text-[#D97706] dark:text-[#FBBF24]",
      border: "border-[#F59E0B]/30",
      label: "SUSPICIOUS",
      icon: AlertTriangle,
    };
  }

  const Icon = colorClasses.icon;

  return (
    <div className="w-full bg-white dark:bg-[#16222E] rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Threat Score
          </span>
          <span className="text-lg font-black text-[#1F2F3D] dark:text-[#F1F5F9]">
            {clampedScore}
            <span className="text-xs font-semibold text-slate-400">/100</span>
          </span>
        </div>

        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${colorClasses.badgeBg} ${colorClasses.badgeText} ${colorClasses.border}`}
        >
          <Icon className="w-3.5 h-3.5" />
          <span>{colorClasses.label}</span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="relative w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses.bar} transition-all duration-700 ease-out rounded-full`}
          style={{ width: `${Math.max(4, clampedScore)}%` }}
        />
      </div>

      {/* Scale Indicator Marks */}
      <div className="flex justify-between text-[10px] font-semibold text-slate-400 dark:text-slate-500 pt-0.5">
        <span className="text-emerald-600 dark:text-emerald-400">0 Safe</span>
        <span className="text-amber-600 dark:text-amber-400">50 Moderate</span>
        <span className="text-red-600 dark:text-red-400">100 Dangerous</span>
      </div>
    </div>
  );
}
