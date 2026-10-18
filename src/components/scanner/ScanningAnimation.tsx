"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, Search, Database, Cpu, Sparkles, Loader2 } from "lucide-react";

interface Step {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SCAN_STEPS: Step[] = [
  { title: "Normalizing & validating URL security…", icon: Search },
  { title: "Expanding link & inspecting redirects…", icon: ShieldCheck },
  { title: "Checking threat feeds & blacklists…", icon: Database },
  { title: "Evaluating structural heuristics…", icon: Cpu },
  { title: "Synthesizing AI security verdict…", icon: Sparkles },
];

export function ScanningAnimation() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < SCAN_STEPS.length - 1 ? prev + 1 : prev));
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  const ActiveIcon = SCAN_STEPS[currentStepIndex].icon;

  return (
    <div className="w-full flex flex-col items-center justify-center py-10 px-4 space-y-6 animate-in fade-in duration-300">
      {/* Pulse Radar Container */}
      <div className="relative flex items-center justify-center">
        <div className="absolute w-28 h-28 rounded-full bg-[#0B5FFF]/15 animate-ping" />
        <div className="absolute w-20 h-20 rounded-full bg-[#0B5FFF]/20 animate-pulse" />
        <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0B5FFF] to-[#2563EB] text-white flex items-center justify-center shadow-lg shadow-[#0B5FFF]/30">
          <ActiveIcon className="w-8 h-8 animate-bounce" />
        </div>
      </div>

      {/* Current Step Label */}
      <div className="text-center space-y-1.5 max-w-xs">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#0B5FFF] text-[11px] font-bold">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Analyzing target</span>
        </div>
        <h3 className="text-sm font-bold text-[#1F2F3D] dark:text-[#F1F5F9] transition-all duration-300">
          {SCAN_STEPS[currentStepIndex].title}
        </h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Please wait while PhishGuard performs comprehensive deep inspection.
        </p>
      </div>

      {/* Progress Dots */}
      <div className="flex items-center gap-1.5 pt-2">
        {SCAN_STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === currentStepIndex
                ? "w-6 bg-[#0B5FFF]"
                : i < currentStepIndex
                ? "w-1.5 bg-[#0B5FFF]/60"
                : "w-1.5 bg-slate-200 dark:bg-slate-700"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
