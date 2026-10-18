import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { runDetectionEngine } from "@/lib/detection";
import { normalizeUrl } from "@/lib/detection/normalize";
import { analyzeNonUrlPayload } from "@/lib/detection/qrPayload";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required to scan links." },
        { status: 401 }
      );
    }

    // Check account status
    const { data: profile } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", user.id)
      .single();

    if (profile?.status === "suspended") {
      return NextResponse.json(
        { error: "Your account is suspended. Please contact support." },
        { status: 403 }
      );
    }

    // Parse & validate body
    const body = await req.json().catch(() => null);
    if (!body || typeof body.url !== "string" || !body.url.trim()) {
      return NextResponse.json(
        { error: "A valid URL or destination text is required." },
        { status: 400 }
      );
    }

    const rawInput = body.url.trim();
    if (rawInput.length > 2048) {
      return NextResponse.json(
        { error: "URL exceeds maximum supported length (2048 characters)." },
        { status: 400 }
      );
    }

    const source = body.source === "qr" ? "qr" : "url";

    // Rate Limiting (20/min, 300/day)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [minCountRes, dayCountRes] = await Promise.all([
      supabase
        .from("scans")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", oneMinuteAgo),
      supabase
        .from("scans")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", oneDayAgo),
    ]);

    if ((minCountRes.count ?? 0) >= 20) {
      return NextResponse.json(
        { error: "Rate limit reached (20 scans/min). Please pause for a moment." },
        { status: 429 }
      );
    }

    if ((dayCountRes.count ?? 0) >= 300) {
      return NextResponse.json(
        { error: "Daily scan limit reached (300 scans/day). Please try again tomorrow." },
        { status: 429 }
      );
    }

    // If source is QR and payload is non-URL (WiFi, Tel, SMS, Mailto, Payment, plain text), handle immediately
    if (source === "qr") {
      const nonUrlCheck = analyzeNonUrlPayload(rawInput);
      if (nonUrlCheck.isNonUrl) {
        const { data: scanRow, error: insertError } = await supabase
          .from("scans")
          .insert({
            user_id: user.id,
            source: "qr",
            input_value: rawInput,
            final_url: null,
            hostname: null,
            registrable_domain: null,
            risk_level: nonUrlCheck.riskLevel,
            risk_score: nonUrlCheck.riskScore,
            reasons: nonUrlCheck.reasons,
            signals: { is_non_url: true, payload_type: nonUrlCheck.payloadType },
            redirect_chain: [],
            ai_explanation: {
              summary: nonUrlCheck.summary,
              bullets: nonUrlCheck.bullets,
              aiVerdict: nonUrlCheck.riskLevel,
              confidence: 1.0,
            },
            engine_version: "1.0.0",
          })
          .select("id")
          .single();

        if (insertError) {
          console.error("Failed to record non-URL QR scan:", insertError);
          return NextResponse.json(
            { error: "Failed to record scan result." },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          scanId: scanRow.id,
          isNonUrl: true,
          payloadType: nonUrlCheck.payloadType,
          actionDescription: nonUrlCheck.actionDescription,
          inputValue: rawInput,
          finalUrl: null,
          hostname: null,
          registrableDomain: null,
          riskLevel: nonUrlCheck.riskLevel,
          riskScore: nonUrlCheck.riskScore,
          reasons: nonUrlCheck.reasons,
          signals: { is_non_url: true, payload_type: nonUrlCheck.payloadType },
          redirectChain: [],
          aiExplanation: {
            summary: nonUrlCheck.summary,
            bullets: nonUrlCheck.bullets,
            aiVerdict: nonUrlCheck.riskLevel,
            confidence: 1.0,
          },
          engineVersion: "1.0.0",
        });
      }
    }

    // Normalize input to compute consistent cache key & check domain rules
    let normalized;
    try {
      normalized = normalizeUrl(rawInput);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format provided." },
        { status: 400 }
      );
    }

    const urlHash = crypto
      .createHash("sha256")
      .update(normalized.url)
      .digest("hex");

    // Check domain rules (block / allow)
    let forcedRule: "block" | "allow" | undefined = undefined;
    const { data: matchedRules } = await supabaseAdmin
      .from("domain_rules")
      .select("domain, rule_type")
      .in("domain", [normalized.hostname, normalized.domain])
      .limit(1);

    if (matchedRules && matchedRules.length > 0) {
      forcedRule = matchedRules[0].rule_type as "block" | "allow";
    }

    // Check scan_cache (24-hour TTL)
    let detectionResult;
    let isFromCache = false;

    if (!forcedRule) {
      const { data: cached } = await supabaseAdmin
        .from("scan_cache")
        .select("result, expires_at")
        .eq("url_hash", urlHash)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (cached && cached.result) {
        detectionResult = cached.result;
        isFromCache = true;
      }
    }

    // Run engine if not cached
    if (!detectionResult) {
      detectionResult = await runDetectionEngine(rawInput, { forcedRule });

      // Save to scan_cache (24h TTL)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await supabaseAdmin.from("scan_cache").upsert({
        url_hash: urlHash,
        result: detectionResult,
        expires_at: expiresAt,
      });
    }

    // Save scan to user history
    const { data: scanRow, error: insertError } = await supabase
      .from("scans")
      .insert({
        user_id: user.id,
        source,
        input_value: rawInput,
        final_url: detectionResult.finalUrl,
        hostname: detectionResult.hostname,
        registrable_domain: detectionResult.registrableDomain,
        risk_level: detectionResult.riskLevel,
        risk_score: detectionResult.riskScore,
        reasons: detectionResult.reasons,
        signals: detectionResult.signals,
        redirect_chain: detectionResult.redirectChain,
        ai_explanation: detectionResult.aiExplanation,
        engine_version: detectionResult.engineVersion,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Failed to persist scan:", insertError);
      return NextResponse.json(
        { error: "Failed to record scan result." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      scanId: scanRow.id,
      cached: isFromCache,
      ...detectionResult,
    });
  } catch (err) {
    console.error("Scan processing error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while analyzing the link." },
      { status: 500 }
    );
  }
}
