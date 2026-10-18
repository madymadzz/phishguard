import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyOrigin } from "@/lib/auth/csrf";
import { z } from "zod";

const reportSchema = z.object({
  scan_id: z.string().uuid("Invalid scan ID format"),
  reason: z
    .string()
    .trim()
    .min(3, "Please provide a reason with at least 3 characters")
    .max(1000, "Reason must be under 1000 characters"),
});

export async function POST(req: NextRequest) {
  try {
    if (!verifyOrigin(req)) {
      return NextResponse.json(
        { error: "Forbidden: Cross-site request rejected" },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required to submit feedback." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = reportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid report payload." },
        { status: 400 }
      );
    }

    const { scan_id, reason } = parsed.data;

    // Verify scan exists
    const { data: scan } = await supabase
      .from("scans")
      .select("id")
      .eq("id", scan_id)
      .maybeSingle();

    if (!scan) {
      return NextResponse.json(
        { error: "Scan record not found." },
        { status: 404 }
      );
    }

    const { data: report, error: insertError } = await supabase
      .from("reports")
      .insert({
        scan_id,
        user_id: user.id,
        reason,
        status: "open",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Failed to submit report:", insertError);
      return NextResponse.json(
        { error: "Failed to submit report. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reportId: report.id,
      message: "Report submitted successfully. Thank you for your feedback!",
    });
  } catch (err) {
    console.error("Report submission error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while saving report." },
      { status: 500 }
    );
  }
}
