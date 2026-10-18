import React from "react";
import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password?: string;
  className?: string;
}

export function PasswordStrength({ password = "", className }: PasswordStrengthProps) {
  const calculateStrength = (pass: string) => {
    let score = 0;
    if (!pass) return { score: 0, label: "", color: "" };

    if (pass.length >= 8) score += 1;
    if (pass.length >= 12) score += 1;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: "Weak", color: "bg-[#E5484D]" };
    if (score <= 3) return { score: 2, label: "Fair", color: "bg-[#F59E0B]" };
    if (score === 4) return { score: 3, label: "Good", color: "bg-blue-500" };
    return { score: 4, label: "Strong", color: "bg-[#22A559]" };
  };

  const { score, label, color } = calculateStrength(password);

  if (!password) return null;

  return (
    <div className={cn("space-y-1.5 mt-1.5", className)}>
      <div className="flex gap-1.5 h-1.5 w-full">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={cn(
              "flex-1 rounded-full transition-all duration-300",
              step <= score ? color : "bg-slate-200 dark:bg-slate-700"
            )}
          />
        ))}
      </div>
      <div className="flex justify-between items-center text-[11px] font-medium text-slate-500 dark:text-slate-400">
        <span>Password strength:</span>
        <span
          className={cn(
            "font-semibold",
            score === 1 && "text-[#E5484D]",
            score === 2 && "text-[#F59E0B]",
            score === 3 && "text-blue-500",
            score === 4 && "text-[#22A559]"
          )}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
