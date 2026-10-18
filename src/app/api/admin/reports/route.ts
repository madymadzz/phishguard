import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const authCheck = await requireAdminApi();
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "all";

  try {
    let query = supabaseAdmin
      .from("reports")
      .select(`
        *,
        scans:scan_id (
          id,
          input_value,
          final_url,
          hostname,
          registrable_domain,
          risk_level,
          risk_score,
          reasons,
          created_at
        ),
        profiles:user_id (
          email,
          display_name
        )
      `)
      .order("created_at", { ascending: false });

    if (status !== "all" && ["open", "reviewed", "resolved"].includes(status)) {
      query = query.eq("status", status);
    }

    const { data: reports, error } = await query;
    if (error) throw error;

    return NextResponse.json({ reports: reports || [] });
  } catch (error) {
    console.error("Error fetching admin reports:", error);
    return NextResponse.json(
      { error: "Failed to load moderation reports" },
      { status: 500 }
    );
  }
}
