import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi, logAdminAction } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const authCheck = await requireAdminApi();
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  try {
    const { data: rows, error } = await supabaseAdmin
      .from("app_settings")
      .select("*");

    if (error) throw error;

    const settingsMap: Record<string, unknown> = {};
    for (const row of rows || []) {
      settingsMap[row.key] = row.value;
    }

    return NextResponse.json({ settings: settingsMap });
  } catch (error) {
    console.error("Error fetching app settings:", error);
    return NextResponse.json(
      { error: "Failed to load platform settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const authCheck = await requireAdminApi();
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  try {
    const body = await request.json();
    const settingsToUpdate = body.settings || (body.key ? { [body.key]: body.value } : null);

    if (!settingsToUpdate || typeof settingsToUpdate !== "object") {
      return NextResponse.json(
        { error: "Provide a 'settings' object with key-value pairs" },
        { status: 400 }
      );
    }

    const updates = Object.entries(settingsToUpdate).map(([key, value]) => ({
      key,
      value,
      updated_at: new Date().toISOString(),
    }));

    for (const item of updates) {
      await supabaseAdmin.from("app_settings").upsert(item);
    }

    // Log admin action
    await logAdminAction({
      actorId: authCheck.user.id,
      action: "app_settings_updated",
      targetType: "app_settings",
      metadata: { changedKeys: Object.keys(settingsToUpdate), values: settingsToUpdate },
    });

    return NextResponse.json({ success: true, updated: settingsToUpdate });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update platform settings" },
      { status: 500 }
    );
  }
}
