import "server-only";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Profile } from "@/types/database.types";

/**
 * Server-side guard for Admin Server Components and Pages.
 * Redirects unauthenticated users to /login and non-admins to /home.
 */
export async function requireAdmin(redirectTo?: string): Promise<{
  user: { id: string; email?: string };
  profile: Profile;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = redirectTo ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : "/login";
    redirect(loginUrl);
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile || profile.role !== "admin" || profile.status === "suspended") {
    redirect("/home");
  }

  return {
    user: { id: user.id, email: user.email },
    profile: profile as Profile,
  };
}

/**
 * Server-side guard for Admin API Route Handlers.
 * Returns { authorized: false, response } if unauthorized/forbidden,
 * or { authorized: true, user, profile } if valid admin.
 */
export async function requireAdminApi(): Promise<
  | { authorized: false; response: NextResponse }
  | { authorized: true; user: { id: string; email?: string }; profile: Profile }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Unauthorized: Authentication required" },
        { status: 401 }
      ),
    };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile || profile.role !== "admin" || profile.status === "suspended") {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Forbidden: Administrator privileges required" },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    user: { id: user.id, email: user.email },
    profile: profile as Profile,
  };
}

/**
 * Append-only helper to record administrative actions into audit_log.
 */
export async function logAdminAction({
  actorId,
  action,
  targetType,
  targetId,
  metadata = {},
}: {
  actorId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await supabaseAdmin.from("audit_log").insert({
      actor_id: actorId,
      action,
      target_type: targetType || null,
      target_id: targetId || null,
      metadata: metadata || {},
    });
  } catch (err) {
    console.error("Failed to write to audit_log:", err);
  }
}
