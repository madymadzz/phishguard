"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Shield,
  UserCheck,
  UserX,
  Trash2,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  X,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface AdminUserRow {
  id: string;
  email: string | null;
  display_name: string | null;
  role: "user" | "admin";
  status: "active" | "suspended";
  created_at: string;
  scanCount: number;
  isCurrentAdmin: boolean;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Action status message
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Delete modal state
  const [userToDelete, setUserToDelete] = useState<AdminUserRow | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load users");
      const json = await res.json();
      setUsers(json.users || []);
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Error loading users",
      });
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (roleFilter !== "all") params.set("role", roleFilter);
        if (statusFilter !== "all") params.set("status", statusFilter);

        const res = await fetch(`/api/admin/users?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load users");
        const json = await res.json();
        if (!cancelled) {
          setUsers(json.users || []);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setFeedback({
            type: "error",
            message: err instanceof Error ? err.message : "Error loading users",
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [search, roleFilter, statusFilter]);

  const handleUpdateUser = async (
    targetUser: AdminUserRow,
    updates: { role?: "user" | "admin"; status?: "active" | "suspended" }
  ) => {
    setActionLoadingId(targetUser.id);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to update user");
      }

      setFeedback({
        type: "success",
        message: `Successfully updated account for ${targetUser.email || targetUser.display_name}.`,
      });

      // Refresh users list
      fetchUsers();
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Update failed",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setActionLoadingId(userToDelete.id);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to delete user");
      }

      setFeedback({
        type: "success",
        message: `User ${userToDelete.email} has been deleted.`,
      });

      setUserToDelete(null);
      fetchUsers();
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Deletion failed",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const adminCount = useMemo(() => users.filter((u) => u.role === "admin").length, [users]);
  const activeCount = useMemo(() => users.filter((u) => u.status === "active").length, [users]);
  const suspendedCount = useMemo(() => users.filter((u) => u.status === "suspended").length, [users]);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#1F2F3D] dark:text-[#F1F5F9] tracking-tight">
            User Accounts & Access Control
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage roles, enforce suspensions, and inspect scan participation across the platform.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#16222E] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#0B5FFF]" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-slate-400">Total Accounts</span>
          <div className="text-xl font-black text-[#1F2F3D] dark:text-[#F1F5F9] mt-0.5">
            {users.length}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-slate-400">Administrators</span>
          <div className="text-xl font-black text-[#0B5FFF] mt-0.5">
            {adminCount}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-slate-400">Active</span>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
            {activeCount}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-slate-400">Suspended</span>
          <div className="text-xl font-black text-[#E5484D] mt-0.5">
            {suspendedCount}
          </div>
        </div>
      </div>

      {/* Feedback Toast / Alert Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between border ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60"
              : "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-900/60"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or email…"
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0B5FFF]"
          />
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#0B5FFF]"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins Only</option>
            <option value="user">Regular Users</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#0B5FFF]"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-3xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/40 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Scans</th>
                <th className="py-3.5 px-4">Joined</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#0B5FFF]" />
                      <span>Loading user accounts…</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No users match your search criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isCurrent = u.isCurrentAdmin;
                  const isBusy = actionLoadingId === u.id;
                  const initials = (u.display_name || u.email || "U")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#0B5FFF] font-black text-[11px] flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-900/60">
                            {initials}
                          </div>
                          <div className="overflow-hidden">
                            <div className="font-bold text-[#1F2F3D] dark:text-[#F1F5F9] flex items-center gap-1.5 truncate">
                              <span>{u.display_name || "Anonymous User"}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded-md bg-blue-100 dark:bg-blue-950 text-[#0B5FFF] text-[9px] font-black uppercase">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate mt-0.5">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        {u.role === "admin" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/60">
                            <Shield className="w-3 h-3" /> Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            User
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {u.status === "active" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 dark:bg-emerald-950/60 text-[#13733A] dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-red-50 dark:bg-red-950/60 text-[#B91C1C] dark:text-red-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Suspended
                          </span>
                        )}
                      </td>

                      {/* Scan Count */}
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/admin/scans?userId=${u.id}`}
                          className="inline-flex items-center gap-1 font-bold text-[#0B5FFF] hover:underline"
                          title="View user scans"
                        >
                          <span>{u.scanCount} scans</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </Link>
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {formatDate(u.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Promote / Demote Button */}
                          {u.role === "admin" ? (
                            <button
                              onClick={() => handleUpdateUser(u, { role: "user" })}
                              disabled={isBusy || isCurrent}
                              title={
                                isCurrent
                                  ? "You cannot demote yourself"
                                  : "Demote to standard user"
                              }
                              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                            >
                              Demote
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateUser(u, { role: "admin" })}
                              disabled={isBusy}
                              title="Promote to administrator"
                              className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#0B5FFF] border border-blue-200 dark:border-blue-900/60 text-[11px] font-bold hover:bg-blue-100 dark:hover:bg-blue-900/80 disabled:opacity-40 transition-colors"
                            >
                              Make Admin
                            </button>
                          )}

                          {/* Suspend / Activate Button */}
                          {u.status === "active" ? (
                            <button
                              onClick={() => handleUpdateUser(u, { status: "suspended" })}
                              disabled={isBusy || isCurrent}
                              title={
                                isCurrent
                                  ? "You cannot suspend yourself"
                                  : "Suspend this user account"
                              }
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 disabled:opacity-40 transition-colors"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateUser(u, { status: "active" })}
                              disabled={isBusy}
                              title="Activate account"
                              className="p-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 disabled:opacity-40 transition-colors"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete User Button */}
                          <button
                            onClick={() => setUserToDelete(u)}
                            disabled={isBusy || isCurrent}
                            title={
                              isCurrent
                                ? "You cannot delete yourself"
                                : "Permanently delete user"
                            }
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-40 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-[#16222E] border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/60 text-[#E5484D] flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#1F2F3D] dark:text-[#F1F5F9]">
                  Delete User Account?
                </h3>
                <p className="text-xs text-slate-400">
                  This action is permanent and cannot be undone.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <div className="font-bold text-slate-700 dark:text-slate-300">
                {userToDelete.display_name || "User"}
              </div>
              <div className="text-slate-400 font-mono text-[11px] truncate">
                {userToDelete.email}
              </div>
              <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-2">
                Deleting this account will remove their profile and all associated scans.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setUserToDelete(null)}
                disabled={actionLoadingId === userToDelete.id}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={actionLoadingId === userToDelete.id}
                className="px-4 py-2 rounded-xl bg-[#E5484D] text-white text-xs font-bold hover:bg-[#c93b40] transition-colors shadow-md shadow-red-500/20 disabled:opacity-50 flex items-center gap-1.5"
              >
                {actionLoadingId === userToDelete.id && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
