import net from "net";
import { getDomain } from "tldts";
import { checkBrandImpersonation } from "./brands";
import type { ReasonItem } from "@/types/database.types";

export interface HeuristicAnalysisParams {
  urlObj: URL;
  initialUrl: string;
  finalUrl: string;
  registrableDomain: string;
  initialDomain: string;
  isShortener: boolean;
  redirectChain: string[];
  hasNoScheme: boolean;
}

export interface HeuristicSignalsResult {
  score: number;
  reasons: ReasonItem[];
  signals: Record<string, boolean | number | string | string[]>;
}

const SUSPICIOUS_TLDS = new Set([
  "zip",
  "mov",
  "top",
  "xyz",
  "win",
  "click",
  "country",
  "gq",
  "tk",
  "ml",
  "cf",
  "ga",
  "work",
  "loan",
  "icu",
  "cyou",
  "rest",
  "buzz",
  "cam",
  "fit",
  "kim",
]);

const PHISHING_KEYWORDS = [
  "login",
  "verify",
  "secure",
  "account",
  "update",
  "confirm",
  "wallet",
  "bank",
  "password",
  "billing",
  "gift",
  "free",
  "claim",
  "otp",
  "signin",
  "security",
  "support",
];

const EXECUTABLE_EXTENSIONS = [
  ".apk",
  ".exe",
  ".scr",
  ".msi",
  ".bat",
  ".jar",
  ".cmd",
  ".vbs",
  ".ps1",
];

export function analyzeHeuristics(params: HeuristicAnalysisParams): HeuristicSignalsResult {
  const {
    urlObj,
    initialUrl,
    finalUrl,
    registrableDomain,
    initialDomain,
    isShortener,
    redirectChain,
  } = params;

  let score = 0;
  const reasons: ReasonItem[] = [];
  const signals: Record<string, boolean | number | string | string[]> = {};

  const hostname = urlObj.hostname.toLowerCase();
  const pathname = urlObj.pathname.toLowerCase();
  const fullUrl = urlObj.toString();

  // 1. Not HTTPS (+20)
  if (urlObj.protocol !== "https:") {
    score += 20;
    signals["not_https"] = true;
    reasons.push({
      code: "NOT_HTTPS",
      severity: "warn",
      message: "This site does not use secure HTTPS encryption. Sensitive data can be intercepted.",
    });
  }

  // 2. Hostname is a raw IP address (+30)
  if (net.isIP(hostname)) {
    score += 30;
    signals["ip_hostname"] = true;
    reasons.push({
      code: "IP_HOSTNAME",
      severity: "danger",
      message: "The link points directly to a raw IP address instead of a recognized domain name.",
    });
  }

  // 3. Punycode / IDN spoofing (+30)
  if (hostname.includes("xn--")) {
    score += 30;
    signals["punycode"] = true;
    reasons.push({
      code: "PUNYCODE",
      severity: "danger",
      message: "Punycode characters detected. Attackers use lookalike foreign alphabets to mimic trusted domains.",
    });
  }

  // 4. Known URL shortener (+10)
  if (isShortener) {
    score += 10;
    signals["url_shortener"] = true;
    reasons.push({
      code: "SHORTENED_URL",
      severity: "warn",
      message: "This link was disguised with a URL shortener to hide the real destination.",
    });
  }

  // 5. User-info / '@' in URL (+30)
  if (initialUrl.includes("@") || finalUrl.includes("@") || urlObj.username || urlObj.password) {
    score += 30;
    signals["userinfo_at_symbol"] = true;
    reasons.push({
      code: "USERINFO_AT_SYMBOL",
      severity: "danger",
      message: "Link contains an '@' symbol, a common tactic used to obscure the actual host being visited.",
    });
  }

  // 6. Suspicious TLD (+15)
  const tld = hostname.split(".").pop() || "";
  if (SUSPICIOUS_TLDS.has(tld)) {
    score += 15;
    signals["suspicious_tld"] = tld;
    reasons.push({
      code: "SUSPICIOUS_TLD",
      severity: "warn",
      message: `Uses a high-risk top-level domain (.${tld}) frequently associated with phishing campaigns.`,
    });
  }

  // 7. Excessive subdomain levels (> 3 subdomains) (+10)
  const subdomainParts = hostname.split(".");
  if (subdomainParts.length > 4) {
    score += 10;
    signals["excessive_subdomains"] = subdomainParts.length;
    reasons.push({
      code: "EXCESSIVE_SUBDOMAINS",
      severity: "warn",
      message: "Unusually deep subdomain structure detected, commonly used to hide fake login portals.",
    });
  }

  // 8. Three or more hyphens in hostname (+10)
  const hyphenCount = (hostname.match(/-/g) || []).length;
  if (hyphenCount >= 3) {
    score += 10;
    signals["excessive_hyphens"] = hyphenCount;
    reasons.push({
      code: "EXCESSIVE_HYPHENS",
      severity: "warn",
      message: "Hostname contains multiple hyphens, often used to simulate official domain names.",
    });
  }

  // 9. URL length > 100 characters (+5)
  if (fullUrl.length > 100) {
    score += 5;
    signals["long_url"] = fullUrl.length;
    reasons.push({
      code: "LONG_URL",
      severity: "info",
      message: "The destination URL is abnormally long, often done to push suspicious parameters off-screen on phones.",
    });
  }

  // 10. Phishing keywords in host (+10) and path (+5), capped at +20
  let keywordScore = 0;
  const foundKeywords: string[] = [];

  for (const kw of PHISHING_KEYWORDS) {
    if (hostname.includes(kw)) {
      keywordScore += 10;
      foundKeywords.push(kw);
    } else if (pathname.includes(kw)) {
      keywordScore += 5;
      foundKeywords.push(kw);
    }
  }

  if (keywordScore > 0) {
    const cappedKwScore = Math.min(keywordScore, 20);
    score += cappedKwScore;
    signals["phishing_keywords"] = foundKeywords;
    reasons.push({
      code: "SUSPICIOUS_KEYWORDS",
      severity: cappedKwScore >= 15 ? "warn" : "info",
      message: `Contains suspicious sensitive keywords (${foundKeywords.slice(0, 3).join(", ")}) related to logins, gifts, or account verifications.`,
    });
  }

  // 11. Brand Impersonation / Typosquatting (+35)
  const brandCheck = checkBrandImpersonation(hostname, pathname, registrableDomain);
  if (brandCheck.isImpersonating) {
    score += 35;
    signals["brand_impersonation"] = true;
    signals["impersonated_brand"] = brandCheck.matchedBrand || "";
    reasons.push({
      code: brandCheck.isTyposquat ? "TYPOSQUAT_BRAND" : "BRAND_IMPERSONATION",
      severity: "danger",
      message:
        brandCheck.reason ||
        `URL closely mimics ${brandCheck.matchedBrand}. Possible impersonation of a legitimate service.`,
    });
  }

  // 12. Redirect chain > 3 hops (+10)
  if (redirectChain.length > 3) {
    score += 10;
    signals["excessive_redirects"] = redirectChain.length;
    reasons.push({
      code: "EXCESSIVE_REDIRECTS",
      severity: "warn",
      message: `Link bounced through ${redirectChain.length - 1} redirects before reaching its destination.`,
    });
  }

  // 13. Redirects to a different registrable domain (+5)
  if (initialDomain && registrableDomain && initialDomain !== registrableDomain) {
    score += 5;
    signals["domain_mismatch_redirect"] = true;
    reasons.push({
      code: "DOMAIN_MISMATCH_REDIRECT",
      severity: "info",
      message: `Redirected to a completely different domain (${registrableDomain}) than the initial link (${initialDomain}).`,
    });
  }

  // 14. Non-standard port (+10)
  if (urlObj.port && urlObj.port !== "80" && urlObj.port !== "443") {
    score += 10;
    signals["non_standard_port"] = urlObj.port;
    reasons.push({
      code: "NON_STANDARD_PORT",
      severity: "warn",
      message: `Runs on a non-standard port (${urlObj.port}), which is uncharacteristic of legitimate commercial services.`,
    });
  }

  // 15. Direct executable/script download (+25)
  const hasExecutableExt = EXECUTABLE_EXTENSIONS.some((ext) => pathname.endsWith(ext));
  if (hasExecutableExt) {
    score += 25;
    signals["direct_executable_download"] = true;
    reasons.push({
      code: "EXECUTABLE_DOWNLOAD",
      severity: "danger",
      message: "Directly downloads executable files or installer scripts that could harm your device.",
    });
  }

  return {
    score: Math.min(score, 100),
    reasons,
    signals,
  };
}

export function evaluateHeuristics(
  urlOrParams: string | HeuristicAnalysisParams,
  isShortener = false,
  redirectChain: string[] = []
): HeuristicSignalsResult {
  if (typeof urlOrParams === "string") {
    let urlObj: URL;
    try {
      urlObj = new URL(urlOrParams);
    } catch {
      urlObj = new URL(`https://${urlOrParams}`);
    }
    const hostname = urlObj.hostname;
    const registrableDomain = getDomain(hostname) || hostname;
    return analyzeHeuristics({
      urlObj,
      initialUrl: urlOrParams,
      finalUrl: urlOrParams,
      registrableDomain,
      initialDomain: registrableDomain,
      isShortener,
      redirectChain: redirectChain.length > 0 ? redirectChain : [urlOrParams],
      hasNoScheme: false,
    });
  }
  return analyzeHeuristics(urlOrParams);
}
