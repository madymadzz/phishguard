import type { ReasonItem } from "@/types/database.types";

export interface UrlhausResult {
  checked: boolean;
  isMalicious: boolean;
  threat?: string;
  reason?: ReasonItem;
}

export async function checkUrlhaus(url: string, authKey?: string): Promise<UrlhausResult> {
  const key = authKey || process.env.URLHAUS_AUTH_KEY;
  if (!key) {
    return { checked: false, isMalicious: false };
  }

  const endpoint = "https://urlhaus-api.abuse.ch/v1/url/";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const formData = new URLSearchParams();
    formData.append("url", url);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Auth-Key": key,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
      signal: controller.signal,
    });

    if (!response.ok) {
      return { checked: false, isMalicious: false };
    }

    const data = await response.json();
    if (data.query_status === "ok") {
      return {
        checked: true,
        isMalicious: true,
        threat: data.threat || "malware_download",
        reason: {
          code: "URLHAUS_MALWARE_HIT",
          severity: "danger",
          message: `Listed in abuse.ch URLhaus threat feed as a verified malicious URL (${data.threat || "malware"}).`,
        },
      };
    }

    return { checked: true, isMalicious: false };
  } catch {
    return { checked: false, isMalicious: false };
  } finally {
    clearTimeout(timeoutId);
  }
}
