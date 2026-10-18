import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi, logAdminAction } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const authCheck = await requireAdminApi();
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  const { id: reportId } = await params;

  try {
    const body = await request.json();
    const { status, admin_note } = body;

    const updatePayload: Record<string, string | null> = {};
    if (status && ["open", "reviewed", "resolved"].includes(status)) {
      updatePayload.status = status;
      if (status === "resolved") {
        updatePayload.resolved_at = new Date().toISOString();
      }
    }

    if (admin_note !== undefined) {
      updatePayload.admin_note = admin_note;
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "No fields provided to update" }, { status: 400 });
    }

    const { data: updatedReport, error: updateErr } = await supabaseAdmin
      .from("reports")
      .update(updatePayload)
      .eq("id", reportId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // Log admin action
    await logAdminAction({
      actorId: authCheck.user.id,
      action: "report_status_updated",
      targetType: "report",
      targetId: reportId,
      metadata: { updates: updatePayload },
    });

    return NextResponse.json({ report: updatedReport });
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json(
      { error: "Failed to update report status" },
      { status: 500 }
    );
  }
}
