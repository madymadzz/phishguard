import React from "react";
import { requireAdmin } from "@/lib/auth/admin";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const metadata = {
  title: "Admin Console | PhishGuard",
  description: "Administrative control center for threat telemetry and security moderation.",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await requireAdmin("/admin");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0E1620] text-slate-900 dark:text-slate-100 flex flex-col md:flex-row antialiased">
      <AdminSidebar
        currentEmail={user.email}
        displayName={profile.display_name || undefined}
      />
      <main className="flex-1 min-w-0 flex flex-col min-h-screen overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
