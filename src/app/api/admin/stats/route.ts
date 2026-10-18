import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const authCheck = await requireAdminApi();
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Fetch Users Metrics
    const { count: totalUsers, error: userErr } = await supabaseAdmin
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: newUsers7d } = await supabaseAdmin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo);

    if (userErr) throw userErr;

    // 2. Fetch Scans Metrics
    const { count: totalScans } = await supabaseAdmin
      .from("scans")
      .select("*", { count: "exact", head: true });

    const { count: scansToday } = await supabaseAdmin
      .from("scans")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfToday);

    const { count: scans7d } = await supabaseAdmin
      .from("scans")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo);

    const { count: safeCount } = await supabaseAdmin
      .from("scans")
      .select("*", { count: "exact", head: true })
      .eq("risk_level", "safe");

    const { count: suspiciousCount } = await supabaseAdmin
      .from("scans")
      .select("*", { count: "exact", head: true })
      .eq("risk_level", "suspicious");

    const { count: dangerousCount } = await supabaseAdmin
      .from("scans")
      .select("*", { count: "exact", head: true })
      .eq("risk_level", "dangerous");

    const { count: urlScansCount } = await supabaseAdmin
      .from("scans")
      .select("*", { count: "exact", head: true })
      .eq("source", "url");

    const { count: qrScansCount } = await supabaseAdmin
      .from("scans")
      .select("*", { count: "exact", head: true })
      .eq("source", "qr");

    // 3. Open Reports
    const { count: openReports } = await supabaseAdmin
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "open");

    // 4. Fetch 30-Day Scans for Trend Chart
    const { data: recent30dScans } = await supabaseAdmin
      .from("scans")
      .select("created_at, risk_level")
      .gte("created_at", thirtyDaysAgo)
      .order("created_at", { ascending: true });

    // Group 30-day scans by day
    const dailyMap: Record<string, { date: string; safe: number; suspicious: number; dangerous: number; total: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split("T")[0];
      dailyMap[dateStr] = { date: dateStr, safe: 0, suspicious: 0, dangerous: 0, total: 0 };
    }

    if (recent30dScans) {
      for (const s of recent30dScans) {
        const dateStr = s.created_at.split("T")[0];
        if (dailyMap[dateStr]) {
          dailyMap[dateStr].total++;
          if (s.risk_level === "safe") dailyMap[dateStr].safe++;
          else if (s.risk_level === "suspicious") dailyMap[dateStr].suspicious++;
          else if (s.risk_level === "dangerous") dailyMap[dateStr].dangerous++;
        }
      }
    }

    const scansPerDay = Object.values(dailyMap);

    // 5. Top Flagged Domains
    const { data: threatScans } = await supabaseAdmin
      .from("scans")
      .select("registrable_domain, risk_level")
      .in("risk_level", ["suspicious", "dangerous"])
      .not("registrable_domain", "is", null)
      .limit(200);

    const domainCountMap: Record<string, { domain: string; count: number; dangerous: number; suspicious: number }> = {};
    if (threatScans) {
      for (const row of threatScans) {
        if (!row.registrable_domain) continue;
        const dom = row.registrable_domain;
        if (!domainCountMap[dom]) {
          domainCountMap[dom] = { domain: dom, count: 0, dangerous: 0, suspicious: 0 };
        }
        domainCountMap[dom].count++;
        if (row.risk_level === "dangerous") domainCountMap[dom].dangerous++;
        if (row.risk_level === "suspicious") domainCountMap[dom].suspicious++;
      }
    }

    const topFlaggedDomains = Object.values(domainCountMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 6. Latest Dangerous Scans
    const { data: latestDangerous } = await supabaseAdmin
      .from("scans")
      .select("id, input_value, hostname, registrable_domain, risk_score, created_at, source")
      .eq("risk_level", "dangerous")
      .order("created_at", { ascending: false })
      .limit(5);

    // 7. Calculate dangerous rate %
    const totalCount = totalScans || 0;
    const dangerousRate = totalCount > 0 ? ((dangerousCount || 0) / totalCount) * 100 : 0;

    // 8. Provider Configuration Status
    const providers = {
      safeBrowsing: {
        name: "Google Safe Browsing v4",
        configured: !!process.env.GOOGLE_SAFE_BROWSING_API_KEY,
        status: process.env.GOOGLE_SAFE_BROWSING_API_KEY ? "active" : "unconfigured",
      },
      urlhaus: {
        name: "abuse.ch URLhaus",
        configured: !!process.env.URLHAUS_AUTH_KEY,
        status: process.env.URLHAUS_AUTH_KEY ? "active" : "unconfigured",
      },
      gemini: {
        name: "Google Gemini AI",
        model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
        configured: !!process.env.GEMINI_API_KEY,
        status: process.env.GEMINI_API_KEY ? "active" : "unconfigured",
      },
    };

    return NextResponse.json({
      kpis: {
        totalUsers: totalUsers || 0,
        newUsers7d: newUsers7d || 0,
        totalScans: totalCount,
        scansToday: scansToday || 0,
        scans7d: scans7d || 0,
        dangerousRate: Math.round(dangerousRate * 10) / 10,
        openReports: openReports || 0,
      },
      verdicts: {
        safe: safeCount || 0,
        suspicious: suspiciousCount || 0,
        dangerous: dangerousCount || 0,
      },
      sources: {
        url: urlScansCount || 0,
        qr: qrScansCount || 0,
      },
      scansPerDay,
      topFlaggedDomains,
      latestDangerous: latestDangerous || [],
      providers,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Failed to load administrative analytics" },
      { status: 500 }
    );
  }
}
