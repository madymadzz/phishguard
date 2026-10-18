"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, History, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    { label: t("nav", "home"), href: "/home", icon: Home },
    { label: t("nav", "history"), href: "/history", icon: History },
    { label: t("nav", "learn"), href: "/learn", icon: BookOpen },
  ];

  return (
    <div className="w-full flex items-center justify-around py-2 px-3">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/home"
            ? pathname === "/home"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center flex-1 py-1.5 px-3 rounded-2xl transition-all duration-200 select-none",
              isActive
                ? "text-[#0B5FFF] font-bold"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            <div
              className={cn(
                "p-1 rounded-xl transition-all",
                isActive && "bg-[#EBF2FF] dark:bg-[#1E293B]"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 transition-transform",
                  isActive ? "scale-110 stroke-[2.5]" : "stroke-[1.8]"
                )}
              />
            </div>
            <span
              className={cn(
                "text-[11px] mt-0.5 tracking-tight transition-all",
                isActive ? "font-bold text-[#0B5FFF]" : "font-medium"
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
