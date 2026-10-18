import crypto from "crypto";
import type { ReasonItem } from "@/types/database.types";

export interface VirusTotalResult {
  checked: boolean;
  maliciousCount: number;
  suspiciousCount: number;
  totalEngines: number;
  points: number;
  isDangerous: boolean;
  reason?: ReasonItem;
}

export async function checkVirusTotal(url: string, apiKey?: string): Promise<VirusTotalResult> {
  const key = apiKey || process.env.VIRUSTOTAL_API_KEY;
  if (!key) {
    return { checked: false, maliciousCount: 0, suspiciousCount: 0, totalEngines: 0, points: 0, isDangerous: false };
  }

  // VirusTotal v3 URL identifier is SHA256 of URL (or base64 without padding)
  const urlSha256 = crypto.createHash("sha256").update(url).digest("hex");
  const endpoint = `https://www.virustotal.com/api/v3/urls/${urlSha256}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "x-apikey": key,
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return { checked: false, maliciousCount: 0, suspiciousCount: 0, totalEngines: 0, points: 0, isDangerous: false };
    }

    const data = await response.json();
    const stats = data.data?.attributes?.last_analysis_stats || {};
    const maliciousCount = stats.malicious || 0;
    const suspiciousCount = stats.suspicious || 0;
    const harmlessCount = stats.harmless || 0;
    const totalEngines = maliciousCount + suspiciousCount + harmlessCount;

    if (maliciousCount >= 3) {
      return {
        checked: true,
        maliciousCount,
        suspiciousCount,
        totalEngines,
        points: 100,
        isDangerous: true,
        reason: {
          code: "VIRUSTOTAL_MALICIOUS_CONSENSUS",
          severity: "danger",
          message: `${maliciousCount} security vendors on VirusTotal flagged this link as malicious.`,
        },
      };
    } else if (maliciousCount >= 1 || suspiciousCount >= 2) {
      return {
        checked: true,
        maliciousCount,
        suspiciousCount,
        totalEngines,
        points: 30,
        isDangerous: false,
        reason: {
          code: "VIRUSTOTAL_SUSPICIOUS",
          severity: "warn",
          message: `${maliciousCount + suspiciousCount} security engines detected suspicious behavior for this URL.`,
        },
      };
    }

    return {
      checked: true,
      maliciousCount,
      suspiciousCount,
      totalEngines,
      points: 0,
      isDangerous: false,
    };
  } catch {
    return { checked: false, maliciousCount: 0, suspiciousCount: 0, totalEngines: 0, points: 0, isDangerous: false };
  } finally {
    clearTimeout(timeoutId);
  }
}
