import type { ReasonItem } from "@/types/database.types";

export interface RdapResult {
  checked: boolean;
  domainAgeDays?: number;
  registrationDate?: string;
  points: number;
  reason?: ReasonItem;
}

export async function checkRdapDomainAge(domain: string): Promise<RdapResult> {
  if (!domain || domain.includes(":") || /^\d+\.\d+\.\d+\.\d+$/.test(domain)) {
    return { checked: false, points: 0 };
  }

  const endpoint = `https://rdap.org/domain/${encodeURIComponent(domain)}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: { Accept: "application/rdap+json, application/json" },
      signal: controller.signal,
    });

    if (!response.ok) {
      return { checked: false, points: 0 };
    }

    const data = await response.json();
    const events: Array<{ eventAction: string; eventDate: string }> = data.events || [];

    const regEvent = events.find(
      (e) =>
        e.eventAction === "registration" ||
        e.eventAction === "created" ||
        e.eventAction === "registration date"
    );

    if (!regEvent || !regEvent.eventDate) {
      return { checked: true, points: 0 };
    }

    const regDate = new Date(regEvent.eventDate);
    const ageDays = Math.floor((Date.now() - regDate.getTime()) / (1000 * 60 * 60 * 24));

    if (ageDays >= 0 && ageDays < 30) {
      return {
        checked: true,
        domainAgeDays: ageDays,
        registrationDate: regEvent.eventDate,
        points: 25,
        reason: {
          code: "DOMAIN_AGE_CRITICAL",
          severity: "danger",
          message: `This domain is brand new (registered only ${ageDays} ${ageDays === 1 ? "day" : "days"} ago). Brand-new domains are a strong phishing indicator.`,
        },
      };
    } else if (ageDays >= 30 && ageDays <= 90) {
      return {
        checked: true,
        domainAgeDays: ageDays,
        registrationDate: regEvent.eventDate,
        points: 10,
        reason: {
          code: "DOMAIN_AGE_RECENT",
          severity: "warn",
          message: `This domain was registered recently (${ageDays} days ago), requiring extra vigilance.`,
        },
      };
    }

    return {
      checked: true,
      domainAgeDays: ageDays,
      registrationDate: regEvent.eventDate,
      points: 0,
    };
  } catch {
    return { checked: false, points: 0 };
  } finally {
    clearTimeout(timeoutId);
  }
}
