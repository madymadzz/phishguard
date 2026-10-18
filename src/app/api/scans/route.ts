import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required to view scan history." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const source = searchParams.get("source") || "all";
    const risk = searchParams.get("risk") || "all";
    const query = searchParams.get("q")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let dbQuery = supabase
      .from("scans")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Source filter: 'all' | 'url' | 'qr'
    if (source === "url" || source === "qr") {
      dbQuery = dbQuery.eq("source", source);
    }

    // Risk level filter: 'safe' | 'suspicious' | 'dangerous'
    if (risk === "safe" || risk === "suspicious" || risk === "dangerous") {
      dbQuery = dbQuery.eq("risk_level", risk);
    }

    // Search text query
    if (query) {
      dbQuery = dbQuery.or(
        `hostname.ilike.%${query}%,input_value.ilike.%${query}%,registrable_domain.ilike.%${query}%`
      );
    }

    // Pagination range
    const { data: scans, count, error } = await dbQuery.range(from, to);

    if (error) {
      console.error("Failed to query scans:", error);
      return NextResponse.json(
        { error: "Failed to load scan records." },
        { status: 500 }
      );
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return NextResponse.json({
      success: true,
      scans: scans || [],
      total,
      page,
      limit,
      totalPages,
      hasMore,
    });
  } catch (err) {
    console.error("Error retrieving scans:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while fetching scan history." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required to delete scans." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const scanId = searchParams.get("id");
    const clearAll = searchParams.get("all") === "true";

    if (clearAll) {
      const { error: deleteError, count } = await supabase
        .from("scans")
        .delete({ count: "exact" })
        .eq("user_id", user.id);

      if (deleteError) {
        console.error("Failed to clear all scans:", deleteError);
        return NextResponse.json(
          { error: "Failed to clear scan history." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Scan history cleared successfully.",
        deletedCount: count ?? 0,
      });
    }

    if (!scanId) {
      return NextResponse.json(
        { error: "Please provide a scan ID or specify all=true." },
        { status: 400 }
      );
    }

    const { error: deleteError, count } = await supabase
      .from("scans")
      .delete({ count: "exact" })
      .eq("id", scanId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Failed to delete scan:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete scan record." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Scan record deleted.",
      deletedCount: count ?? 1,
    });
  } catch (err) {
    console.error("Error deleting scan(s):", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while deleting scan(s)." },
      { status: 500 }
    );
  }
}
