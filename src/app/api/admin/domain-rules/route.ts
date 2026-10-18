import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi, logAdminAction } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getDomain } from "tldts";

export async function GET(request: NextRequest) {
  const authCheck = await requireAdminApi();
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.toLowerCase().trim() || "";
  const ruleType = searchParams.get("type") || "all";

  try {
    let query = supabaseAdmin
      .from("domain_rules")
      .select("*")
      .order("created_at", { ascending: false });

    if (ruleType === "block" || ruleType === "allow") {
      query = query.eq("rule_type", ruleType);
    }

    if (search) {
      query = query.or(`domain.ilike.%${search}%,note.ilike.%${search}%`);
    }

    const { data: rules, error } = await query;
    if (error) throw error;

    return NextResponse.json({ rules: rules || [] });
  } catch (error) {
    console.error("Error fetching domain rules:", error);
    return NextResponse.json(
      { error: "Failed to load domain rules" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authCheck = await requireAdminApi();
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  try {
    const body = await request.json();
    const adminId = authCheck.user.id;

    // Check if bulk insert or single insert
    const rulesToInsert: Array<{
      domain: string;
      rule_type: "block" | "allow";
      note: string;
      created_by: string;
    }> = [];

    if (Array.isArray(body.rules)) {
      for (const item of body.rules) {
        if (!item.domain || !item.rule_type) continue;
        const raw = item.domain.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
        const targetDomain = getDomain(raw) || raw;
        rulesToInsert.push({
          domain: targetDomain,
          rule_type: item.rule_type === "block" ? "block" : "allow",
          note: item.note || "Imported via bulk rule action",
          created_by: adminId,
        });
      }
    } else if (body.domain && body.rule_type) {
      const raw = body.domain.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
      const targetDomain = getDomain(raw) || raw;
      rulesToInsert.push({
        domain: targetDomain,
        rule_type: body.rule_type === "block" ? "block" : "allow",
        note: body.note || "",
        created_by: adminId,
      });
    } else {
      return NextResponse.json(
        { error: "Invalid payload: provide domain and rule_type ('block' or 'allow')" },
        { status: 400 }
      );
    }

    if (rulesToInsert.length === 0) {
      return NextResponse.json({ error: "No valid domain rules to insert" }, { status: 400 });
    }

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("domain_rules")
      .upsert(rulesToInsert, { onConflict: "domain,rule_type" })
      .select();

    if (insertErr) throw insertErr;

    // Log admin action
    await logAdminAction({
      actorId: adminId,
      action: "domain_rules_created",
      targetType: "domain_rule",
      metadata: { count: rulesToInsert.length, rules: rulesToInsert },
    });

    return NextResponse.json({ success: true, count: inserted?.length || 0 });
  } catch (error) {
    console.error("Error creating domain rules:", error);
    return NextResponse.json(
      { error: "Failed to persist domain rules" },
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
  const ruleId = searchParams.get("id");

  if (!ruleId) {
    return NextResponse.json({ error: "Missing rule id parameter" }, { status: 400 });
  }

  try {
    const { data: rule, error: fetchErr } = await supabaseAdmin
      .from("domain_rules")
      .select("*")
      .eq("id", ruleId)
      .maybeSingle();

    if (fetchErr || !rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    const { error: delErr } = await supabaseAdmin
      .from("domain_rules")
      .delete()
      .eq("id", ruleId);

    if (delErr) throw delErr;

    // Log deletion
    await logAdminAction({
      actorId: authCheck.user.id,
      action: "domain_rule_deleted",
      targetType: "domain_rule",
      targetId: ruleId,
      metadata: { deletedRule: rule },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting domain rule:", error);
    return NextResponse.json(
      { error: "Failed to delete domain rule" },
      { status: 500 }
    );
  }
}
