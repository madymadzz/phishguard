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
  const role = searchParams.get("role") || "all";
  const status = searchParams.get("status") || "all";

  try {
    let query = supabaseAdmin
      .from("profiles")
      .select("id, email, display_name, role, status, created_at")
      .order("created_at", { ascending: false });

    if (role === "user" || role === "admin") {
      query = query.eq("role", role);
    }

    if (status === "active" || status === "suspended") {
      query = query.eq("status", status);
    }

    const { data: profiles, error: profileErr } = await query;
    if (profileErr) throw profileErr;

    // Filter by search if provided
    let filteredProfiles = profiles || [];
    if (search) {
      filteredProfiles = filteredProfiles.filter(
        (p) =>
          p.email?.toLowerCase().includes(search) ||
          p.display_name?.toLowerCase().includes(search)
      );
    }

    // Fetch scan counts per user
    const { data: scanRows, error: scanErr } = await supabaseAdmin
      .from("scans")
      .select("user_id");

    if (scanErr) throw scanErr;

    const scanCountMap: Record<string, number> = {};
    if (scanRows) {
      for (const row of scanRows) {
        if (!row.user_id) continue;
        scanCountMap[row.user_id] = (scanCountMap[row.user_id] || 0) + 1;
      }
    }

    const usersWithStats = filteredProfiles.map((p) => ({
      ...p,
      scanCount: scanCountMap[p.id] || 0,
      isCurrentAdmin: p.id === authCheck.user.id,
    }));

    return NextResponse.json({
      users: usersWithStats,
      total: usersWithStats.length,
    });
  } catch (error) {
    console.error("Error fetching admin users:", error);
    return NextResponse.json(
      { error: "Failed to load users list" },
      { status: 500 }
    );
  }
}
