"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Search,
  ShieldAlert,
  Flag,
  BookOpen,
  Settings,
  ClipboardList,
  Smartphone,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { createClient } from "@/lib/supabase/client";

interface AdminSidebarProps {
  currentEmail?: string;
  displayName?: string;
}

const NAV_ITEMS = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    name: "Scans",
    href: "/admin/scans",
    icon: Search,
  },
  {
    name: "Domain Rules",
    href: "/admin/domain-rules",
    icon: ShieldAlert,
  },
  {
    name: "Reports",
    href: "/admin/reports",
    icon: Flag,
  },
  {
    name: "Learn CMS",
    href: "/admin/learn",
    icon: BookOpen,
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
  {
    name: "Audit Log",
    href: "/admin/audit-log",
    icon: ClipboardList,
  },
];

export function AdminSidebar({ currentEmail, displayName }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navContent = (
    <div className="flex flex-col h-full bg-[#1F2F3D] text-slate-100 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-700/60 flex items-center justify-between">
        <div className="flex flex-col">
          <Logo size="sm" showTagline={false} />
          <div className="flex items-center gap-1.5 mt-2">
            <span className="px-2 py-0.5 rounded-md bg-[#0B5FFF] text-white text-[10px] font-black uppercase tracking-widest shadow-2xs">
              Admin Console
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
        </div>
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Management
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href === "/admin/dashboard" && pathname === "/admin");

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? "bg-[#0B5FFF] text-white shadow-md shadow-blue-500/20"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Switch to User App & Profile Footer */}
      <div className="p-3 border-t border-slate-700/60 space-y-2">
        <Link
          href="/home"
          className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-800/60 hover:bg-slate-800 hover:text-white border border-slate-700/60 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#0B5FFF]" />
            <span>Switch to App</span>
          </div>
          <span className="text-[10px] text-slate-400">Mobile UI</span>
        </Link>

        {/* Current Admin Profile */}
        <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 flex items-center justify-between">
          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white truncate">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{displayName || "Administrator"}</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">
              {currentEmail || "admin@phishguard.local"}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700/60 transition-colors"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="md:hidden sticky top-0 z-40 bg-[#1F2F3D] text-white px-4 py-3 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-xs font-black uppercase tracking-wider text-[#0B5FFF]">
            Admin Console
          </span>
        </div>
        <Link
          href="/home"
          className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>App</span>
        </Link>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="w-72 h-full bg-[#1F2F3D]"
            onClick={(e) => e.stopPropagation()}
          >
            {navContent}
          </div>
        </div>
      )}

      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 shrink-0 border-r border-slate-800">
        {navContent}
      </aside>
    </>
  );
}
