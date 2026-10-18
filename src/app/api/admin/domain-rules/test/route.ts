import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeUrl } from "@/lib/detection/normalize";

export async function POST(request: NextRequest) {
  const authCheck = await requireAdminApi();
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  try {
    const { input } = await request.json();
    if (!input || typeof input !== "string") {
      return NextResponse.json({ error: "Missing input string" }, { status: 400 });
    }

    const cleaned = normalizeUrl(input.trim().toLowerCase());
    const candidates = [cleaned.hostname, cleaned.registrableDomain].filter(Boolean) as string[];

    if (candidates.length === 0) {
      return NextResponse.json({
        matched: false,
        ruleType: null,
        message: "Unable to parse valid domain or hostname from input.",
      });
    }

    // Query domain_rules for matches
    const { data: rules } = await supabaseAdmin
      .from("domain_rules")
      .select("*")
      .in("domain", candidates);

    if (rules && rules.length > 0) {
      // Prioritize block over allow
      const blockRule = rules.find((r) => r.rule_type === "block");
      const matchedRule = blockRule || rules[0];

      return NextResponse.json({
        matched: true,
        candidateDomains: candidates,
        ruleType: matchedRule.rule_type,
        rule: matchedRule,
        message: `Domain matches ${matchedRule.rule_type.toUpperCase()} rule: ${matchedRule.domain} (Note: ${matchedRule.note || "None"})`,
      });
    }

    return NextResponse.json({
      matched: false,
      candidateDomains: candidates,
      ruleType: null,
      rule: null,
      message: "No explicit allowlist or blocklist rule matches this domain.",
    });
  } catch (error) {
    console.error("Error testing domain rule:", error);
    return NextResponse.json(
      { error: "Failed to evaluate domain rule test" },
      { status: 500 }
    );
  }
}
