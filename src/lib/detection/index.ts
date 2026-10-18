import { normalizeUrl } from "./normalize";
import { assertSafeUrlTarget } from "./ssrf";
import { unshortenUrl } from "./unshorten";
import { evaluateHeuristics } from "./heuristics";
import { checkSafeBrowsing } from "./providers/safeBrowsing";
import { checkUrlhaus } from "./providers/urlhaus";
import { checkRdapDomainAge } from "./providers/rdap";
import { checkVirusTotal } from "./providers/virustotal";
import { evaluateRiskScore } from "./score";
import { generateExplanation, AIExplanation } from "./explain";
import { parse as parseDomain } from "tldts";
import type { RiskLevel, ReasonItem } from "@/types/database.types";

export interface DetectionResult {
  inputValue: string;
  finalUrl: string;
  hostname: string;
  registrableDomain: string;
  riskLevel: RiskLevel;
  riskScore: number;
  reasons: ReasonItem[];
  signals: Record<string, unknown>;
  redirectChain: string[];
  aiExplanation: AIExplanation;
  engineVersion: string;
}

export const ENGINE_VERSION = "1.0.0";

export async function runDetectionEngine(
  inputUrl: string,
  options?: {
    forcedRule?: "block" | "allow";
  }
): Promise<DetectionResult> {
  const normalized = normalizeUrl(inputUrl);
  const initialHostname = normalized.hostname || (normalized.parsed ? normalized.parsed.hostname : "");

  // If forced allow rule exists
  if (options?.forcedRule === "allow") {
    return {
      inputValue: inputUrl,
      finalUrl: normalized.url,
      hostname: initialHostname,
      registrableDomain: normalized.domain,
      riskLevel: "safe",
      riskScore: 0,
      reasons: [
        {
          code: "DOMAIN_RULE_ALLOW",
          severity: "info",
          message: "Domain is explicitly allowlisted by system administrators.",
        },
      ],
      signals: { rule_allow: true },
      redirectChain: [normalized.url],
      aiExplanation: {
        summary: "This domain is on the organization's verified trusted allowlist.",
        bullets: ["Verified trusted domain", "Whitelisted by administrative policy"],
        aiVerdict: "safe",
        confidence: 1.0,
        source: "fallback",
      },
      engineVersion: ENGINE_VERSION,
    };
  }

  // If forced block rule exists
  if (options?.forcedRule === "block") {
    return {
      inputValue: inputUrl,
      finalUrl: normalized.url,
      hostname: initialHostname,
      registrableDomain: normalized.domain,
      riskLevel: "dangerous",
      riskScore: 100,
      reasons: [
        {
          code: "DOMAIN_RULE_BLOCK",
          severity: "danger",
          message: "Domain is explicitly blocked by system administrators as a verified threat.",
        },
      ],
      signals: { rule_block: true },
      redirectChain: [normalized.url],
      aiExplanation: {
        summary: "Access blocked: This domain has been blacklisted by administrator policy due to security risks.",
        bullets: ["Blocked by administrative security rules", "High risk of phishing or credential harvesting"],
        aiVerdict: "dangerous",
        confidence: 1.0,
        source: "fallback",
      },
      engineVersion: ENGINE_VERSION,
    };
  }

  // SSRF check on initial target
  const initialSsrfSafe = await assertSafeUrlTarget(normalized.url);
  if (!initialSsrfSafe) {
    return {
      inputValue: inputUrl,
      finalUrl: normalized.url,
      hostname: initialHostname,
      registrableDomain: normalized.domain,
      riskLevel: "dangerous",
      riskScore: 100,
      reasons: [
        {
          code: "SSRF_BLOCKED",
          severity: "danger",
          message: "Target resolves to a private, loopback, or non-routable internal IP address.",
        },
      ],
      signals: { ssrf_blocked: true },
      redirectChain: [normalized.url],
      aiExplanation: {
        summary: "Security hazard: Link directs to private internal infrastructure.",
        bullets: ["Private or loopback IP address", "Potential Server-Side Request Forgery attempt"],
        aiVerdict: "dangerous",
        confidence: 1.0,
        source: "fallback",
      },
      engineVersion: ENGINE_VERSION,
    };
  }

  // 1. Unshorten URL (follow redirects up to 5 hops with SSRF checks)
  const unshortenResult = await unshortenUrl(normalized.url);
  const finalUrl = unshortenResult.finalUrl;
  const redirectChain = unshortenResult.redirectChain;

  if (unshortenResult.ssrfBlocked) {
    let ssrfHost = "";
    try {
      ssrfHost = new URL(finalUrl).hostname;
    } catch {
      ssrfHost = initialHostname;
    }

    return {
      inputValue: inputUrl,
      finalUrl,
      hostname: ssrfHost,
      registrableDomain: parseDomain(finalUrl).domain || ssrfHost,
      riskLevel: "dangerous",
      riskScore: 100,
      reasons: [
        {
          code: "SSRF_REDIRECT_BLOCKED",
          severity: "danger",
          message: "Redirect chain targeted a forbidden private or local network address.",
        },
      ],
      signals: { ssrf_redirect_blocked: true },
      redirectChain,
      aiExplanation: {
        summary: "Security hazard: Redirect led to a restricted internal network address.",
        bullets: ["Redirected to private IP range", "Blocked by network isolation policy"],
        aiVerdict: "dangerous",
        confidence: 1.0,
        source: "fallback",
      },
      engineVersion: ENGINE_VERSION,
    };
  }

  let finalParsed: URL;
  try {
    finalParsed = new URL(finalUrl);
  } catch {
    finalParsed = normalized.parsed || new URL(`https://${initialHostname}`);
  }

  const finalParsedDomain = parseDomain(finalUrl);
  const finalHostname = finalParsed.hostname;
  const finalRegistrableDomain = finalParsedDomain.domain || finalHostname;
  const finalTld = finalParsedDomain.publicSuffix || "";

  // 2. Evaluate structural heuristics
  const heuristicsResult = evaluateHeuristics(
    finalUrl,
    unshortenResult.isShortener || redirectChain.length > 1,
    redirectChain
  );

  const reasons: ReasonItem[] = [...heuristicsResult.reasons];
  const signals: Record<string, unknown> = { ...heuristicsResult.signals };
  let threatFeedHit = false;
  let rawScore = heuristicsResult.score;

  // 3. Query external reputation and intelligence providers in parallel
  const [sbResult, uhResult, rdapResult, vtResult] = await Promise.allSettled([
    checkSafeBrowsing(finalUrl),
    checkUrlhaus(finalUrl),
    checkRdapDomainAge(finalRegistrableDomain),
    checkVirusTotal(finalUrl),
  ]);

  // Google Safe Browsing
  if (sbResult.status === "fulfilled" && sbResult.value.isMalicious) {
    threatFeedHit = true;
    signals.threat_safe_browsing = true;
    if (sbResult.value.reason) {
      reasons.push(sbResult.value.reason);
    }
  }

  // URLhaus
  if (uhResult.status === "fulfilled" && uhResult.value.isMalicious) {
    threatFeedHit = true;
    signals.threat_urlhaus = true;
    if (uhResult.value.reason) {
      reasons.push(uhResult.value.reason);
    }
  }

  // RDAP Domain Age
  if (rdapResult.status === "fulfilled" && rdapResult.value.checked) {
    signals.rdap_checked = true;
    rawScore += rdapResult.value.points;
    if (rdapResult.value.reason) {
      reasons.push(rdapResult.value.reason);
    }
  }

  // VirusTotal
  if (vtResult.status === "fulfilled" && vtResult.value.checked) {
    signals.threat_virustotal = true;
    if (vtResult.value.isDangerous) {
      threatFeedHit = true;
    } else {
      rawScore += vtResult.value.points;
    }
    if (vtResult.value.reason) {
      reasons.push(vtResult.value.reason);
    }
  }

  // 4. Calculate baseline risk score
  const scoreResult = evaluateRiskScore(rawScore, threatFeedHit);
  let finalRiskLevel = scoreResult.riskLevel;
  const finalRiskScore = scoreResult.score;

  // 5. Generate AI Explanation (Gemini with strict fallback)
  const aiExplanation = await generateExplanation(
    {
      hostname: finalHostname,
      pathname: finalParsed.pathname,
      search: finalParsed.search,
      tld: finalTld,
      score: finalRiskScore,
      reasons,
      redirectChain: redirectChain.map((url) => {
        try {
          return { url, hostname: new URL(url).hostname };
        } catch {
          return { url };
        }
      }),
      threatFeedHit,
    },
    finalRiskLevel
  );

  // 6. Apply AI Verdict adjustment rule (Section 3.4)
  // Only called in gray zone (20-64), can raise level by one band when confidence >= 0.7, never lowers, never overrides threat feed
  if (!threatFeedHit && finalRiskScore >= 20 && finalRiskScore <= 64) {
    if (finalRiskLevel === "safe" && aiExplanation.aiVerdict === "suspicious" && aiExplanation.confidence >= 0.7) {
      finalRiskLevel = "suspicious";
    } else if (
      finalRiskLevel === "suspicious" &&
      aiExplanation.aiVerdict === "dangerous" &&
      aiExplanation.confidence >= 0.7
    ) {
      finalRiskLevel = "dangerous";
    }
  }

  return {
    inputValue: inputUrl,
    finalUrl,
    hostname: finalHostname,
    registrableDomain: finalRegistrableDomain,
    riskLevel: finalRiskLevel,
    riskScore: finalRiskScore,
    reasons,
    signals,
    redirectChain,
    aiExplanation,
    engineVersion: ENGINE_VERSION,
  };
}
