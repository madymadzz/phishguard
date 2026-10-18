import type { ReasonItem } from "@/types/database.types";

export interface SafeBrowsingResult {
  checked: boolean;
  isMalicious: boolean;
  threatType?: string;
  reason?: ReasonItem;
}

export async function checkSafeBrowsing(url: string, apiKey?: string): Promise<SafeBrowsingResult> {
  const key = apiKey || process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (!key) {
    return { checked: false, isMalicious: false };
  }

  const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${key}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const payload = {
      client: {
        clientId: "phishguard",
        clientVersion: "1.0.0",
      },
      threatInfo: {
        threatTypes: [
          "MALWARE",
          "SOCIAL_ENGINEERING",
          "UNWANTED_SOFTWARE",
          "POTENTIALLY_HARMFUL_APPLICATION",
        ],
        platformTypes: ["ANY_PLATFORM"],
        threatEntryTypes: ["URL"],
        threatEntries: [{ url }],
      },
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      return { checked: false, isMalicious: false };
    }

    const data = await response.json();
    const matches = data.matches || [];

    if (matches.length > 0) {
      const threat = matches[0].threatType;
      const isPhishing = threat === "SOCIAL_ENGINEERING";

      return {
        checked: true,
        isMalicious: true,
        threatType: threat,
        reason: {
          code: "GOOGLE_SAFE_BROWSING_HIT",
          severity: "danger",
          message: isPhishing
            ? "Flagged by Google Safe Browsing as a confirmed deceptive phishing site."
            : `Flagged by Google Safe Browsing threat database (${threat}).`,
        },
      };
    }

    return { checked: true, isMalicious: false };
  } catch {
    // Failures must never break the scan
    return { checked: false, isMalicious: false };
  } finally {
    clearTimeout(timeoutId);
  }
}
