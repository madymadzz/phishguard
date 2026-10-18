import { getDomain, getPublicSuffix } from "tldts";

export interface NormalizedUrlResult {
  originalInput: string;
  normalizedUrl: string;
  url: string; // alias for normalizedUrl
  urlObj: URL | null;
  parsed: URL | null; // alias for urlObj
  hostname: string;
  registrableDomain: string;
  domain: string; // alias for registrableDomain
  tld: string;
  isDangerousScheme: boolean;
  hasNoScheme: boolean;
  error?: string;
}

const DANGEROUS_SCHEMES = ["javascript:", "data:", "file:", "vbscript:"];

export function normalizeUrl(input: string): NormalizedUrlResult {
  const trimmed = input.trim();
  const lowerTrimmed = trimmed.toLowerCase();

  // Check dangerous pseudo-schemes
  for (const scheme of DANGEROUS_SCHEMES) {
    if (lowerTrimmed.startsWith(scheme)) {
      throw new Error(`Dangerous URL protocol detected: ${scheme} is not permitted.`);
    }
  }

  let workingUrl = trimmed;
  let hasNoScheme = false;

  // Add https:// if no scheme is provided
  if (!/^https?:\/\//i.test(workingUrl)) {
    hasNoScheme = true;
    workingUrl = `https://${workingUrl}`;
  }

  try {
    const urlObj = new URL(workingUrl);
    // Strip hash fragment for clean URL analysis
    urlObj.hash = "";

    const hostname = urlObj.hostname.toLowerCase();
    const registrableDomain = getDomain(hostname) || hostname;
    const tld = getPublicSuffix(hostname) || "";
    const finalUrl = urlObj.toString();

    return {
      originalInput: trimmed,
      normalizedUrl: finalUrl,
      url: finalUrl,
      urlObj,
      parsed: urlObj,
      hostname,
      registrableDomain: registrableDomain.toLowerCase(),
      domain: registrableDomain.toLowerCase(),
      tld: tld.toLowerCase(),
      isDangerousScheme: false,
      hasNoScheme,
    };
  } catch (err) {
    return {
      originalInput: trimmed,
      normalizedUrl: workingUrl,
      url: workingUrl,
      urlObj: null,
      parsed: null,
      hostname: "",
      registrableDomain: "",
      domain: "",
      tld: "",
      isDangerousScheme: false,
      hasNoScheme,
      error: err instanceof Error ? err.message : "Invalid URL",
    };
  }
}

/**
 * Defang a URL for safe display in UI (e.g. hxxps://evil.com/path)
 */
export function defangUrl(url: string): string {
  return url
    .replace(/^https:\/\//i, "hxxps://")
    .replace(/^http:\/\//i, "hxxp://")
    .replace(/\./g, "[.]");
}
