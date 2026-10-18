import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Logo } from "@/components/ui/logo";
import { Wrench } from "lucide-react";

export default function MaintenancePage() {
  return (
    <AppShell>
      <div className="flex-1 px-6 py-12 flex flex-col items-center justify-center text-center">
        <Logo size="md" showWordmark={true} showTagline={false} className="mb-6" />

        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mb-4">
          <Wrench className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-extrabold text-[#1F2F3D] dark:text-[#F1F5F9]">
          Under Maintenance
        </h1>

        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-xs leading-relaxed">
          PhishGuard is currently undergoing scheduled platform upgrades to keep your link scanning fast and secure.
        </p>

        <p className="text-xs text-slate-400 dark:text-slate-500 mt-6">
          Please check back shortly. Thank you for your patience!
        </p>
      </div>
    </AppShell>
  );
}
