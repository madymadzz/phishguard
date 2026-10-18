import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi, logAdminAction } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const authCheck = await requireAdminApi();
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.toLowerCase().trim() || "";
  const risk = searchParams.get("risk") || "all";
  const source = searchParams.get("source") || "all";
  const userId = searchParams.get("userId") || "";
  const format = searchParams.get("format") || "json";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const offset = (page - 1) * limit;

  try {
    let query = supabaseAdmin
      .from("scans")
      .select("*, profiles:user_id(email, display_name)", { count: "exact" })
      .order("created_at", { ascending: false });

    if (risk !== "all" && ["safe", "suspicious", "dangerous"].includes(risk)) {
      query = query.eq("risk_level", risk);
    }

    if (source !== "all" && ["url", "qr"].includes(source)) {
      query = query.eq("source", source);
    }

    if (userId) {
      query = query.eq("user_id", userId);
    }

    if (search) {
      query = query.or(
        `input_value.ilike.%${search}%,hostname.ilike.%${search}%,registrable_domain.ilike.%${search}%`
      );
    }

    // If CSV export is requested, retrieve all matching records without pagination limit
    if (format === "csv") {
      const { data: allScans, error: csvErr } = await query.limit(2000);
      if (csvErr) throw csvErr;

      const header = "Scan ID,Date,Source,Risk Level,Risk Score,Domain,Final URL,Original Input,User Email\n";
      const rows = (allScans || [])
        .map((s) => {
          const email = (s.profiles as { email?: string })?.email || "anonymous";
          const escapeCsv = (str: string | null | undefined) =>
            `"${(str || "").replace(/"/g, '""')}"`;

          return [
            s.id,
            s.created_at,
            s.source,
            s.risk_level,
            s.risk_score,
            escapeCsv(s.registrable_domain || s.hostname),
            escapeCsv(s.final_url),
            escapeCsv(s.input_value),
            escapeCsv(email),
          ].join(",");
        })
        .join("\n");

      const csvContent = header + rows;
      const today = new Date().toISOString().split("T")[0];

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="phishguard_scans_${today}.csv"`,
        },
      });
    }

    // Standard paginated JSON response
    query = query.range(offset, offset + limit - 1);
    const { data: scans, count, error: fetchErr } = await query;
    if (fetchErr) throw fetchErr;

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      scans: scans || [],
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching admin scans:", error);
    return NextResponse.json(
      { error: "Failed to retrieve scan telemetry" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const authCheck = await requireAdminApi();
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  const { searchParams } = new URL(request.url);
  const scanId = searchParams.get("id");

  if (!scanId) {
    return NextResponse.json({ error: "Missing required 'id' parameter" }, { status: 400 });
  }

  try {
    const { data: scan, error: getErr } = await supabaseAdmin
      .from("scans")
      .select("id, input_value, hostname")
      .eq("id", scanId)
      .maybeSingle();

    if (getErr || !scan) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }

    const { error: delErr } = await supabaseAdmin
      .from("scans")
      .delete()
      .eq("id", scanId);

    if (delErr) throw delErr;

    // Log admin deletion action
    await logAdminAction({
      actorId: authCheck.user.id,
      action: "scan_record_deleted",
      targetType: "scan",
      targetId: scanId,
      metadata: { deletedDomain: scan.hostname, input: scan.input_value },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting scan:", error);
    return NextResponse.json(
      { error: "Failed to delete scan record" },
      { status: 500 }
    );
  }
}
