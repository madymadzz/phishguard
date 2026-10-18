import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const authCheck = await requireAdminApi();
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.toLowerCase().trim() || "";
  const action = searchParams.get("action") || "all";
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const offset = (page - 1) * limit;

  try {
    let query = supabaseAdmin
      .from("audit_log")
      .select("*, profiles:actor_id(email, display_name)", { count: "exact" })
      .order("created_at", { ascending: false });

    if (action !== "all") {
      query = query.eq("action", action);
    }

    if (search) {
      query = query.or(
        `action.ilike.%${search}%,target_type.ilike.%${search}%,target_id.ilike.%${search}%`
      );
    }

    query = query.range(offset, offset + limit - 1);
    const { data: logs, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      logs: logs || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: "Failed to load audit trail" },
      { status: 500 }
    );
  }
}
