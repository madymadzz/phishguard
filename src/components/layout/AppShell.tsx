import React from "react";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
  showHeader?: boolean;
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
}

export function AppShell({
  children,
  className,
  showHeader = false,
  headerContent,
  footerContent,
}: AppShellProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 dark:bg-[#070B10] p-0 sm:py-6">
      <div className={cn("app-container", className)}>
        {showHeader && headerContent && (
          <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-[#16222E]/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 safe-area-top">
            <div className="px-4 py-3 flex items-center justify-between">
              {headerContent}
            </div>
          </header>
        )}

        <main className="flex-1 w-full flex flex-col relative overflow-x-hidden">
          {children}
        </main>

        {footerContent && (
          <nav className="sticky bottom-0 z-40 w-full bg-white/90 dark:bg-[#16222E]/90 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 safe-area-bottom">
            {footerContent}
          </nav>
        )}
      </div>
    </div>
  );
}
