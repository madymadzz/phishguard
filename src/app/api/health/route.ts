import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Health check & Keep-alive endpoint
 * Pings database to prevent Supabase free tier inactivity pausing
 * and verifies system uptime.
 */
export async function GET() {
  const startTime = Date.now();
  let dbStatus = "connected";
  let dbLatencyMs = 0;

  try {
    const dbStart = Date.now();
    const { error } = await supabaseAdmin
      .from("app_settings")
      .select("key")
      .limit(1);

    dbLatencyMs = Date.now() - dbStart;
    if (error) {
      dbStatus = "error: " + error.message;
    }
  } catch (err) {
    dbStatus = "unreachable: " + (err instanceof Error ? err.message : String(err));
  }

  const isHealthy = dbStatus === "connected";

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: "1.0.0",
      environment: process.env.NODE_ENV,
      checks: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
        },
      },
      responseTimeMs: Date.now() - startTime,
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
