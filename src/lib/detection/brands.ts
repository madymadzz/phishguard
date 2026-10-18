import { distance } from "fastest-levenshtein";

export interface BrandRule {
  name: string;
  keywords: string[];
  officialDomains: string[];
  category: "philippine_finance" | "philippine_gov" | "philippine_telco" | "e_commerce" | "global_tech";
}

export const MONITORED_BRANDS: BrandRule[] = [
  // Philippine E-Wallets & Banking
  {
    name: "GCash",
    keywords: ["gcash", "mygcash"],
    officialDomains: ["gcash.com"],
    category: "philippine_finance",
  },
  {
    name: "Maya",
    keywords: ["maya", "paymaya"],
    officialDomains: ["maya.ph", "paymaya.com"],
    category: "philippine_finance",
  },
  {
    name: "BDO",
    keywords: ["bdo", "bdocash", "bdoonline"],
    officialDomains: ["bdo.com.ph"],
    category: "philippine_finance",
  },
  {
    name: "BPI",
    keywords: ["bpi", "bpionline"],
    officialDomains: ["bpi.com.ph", "bpiexpressonline.com"],
    category: "philippine_finance",
  },
  {
    name: "Landbank",
    keywords: ["landbank", "lbp"],
    officialDomains: ["landbank.com"],
    category: "philippine_finance",
  },
  {
    name: "Metrobank",
    keywords: ["metrobank"],
    officialDomains: ["metrobank.com.ph"],
    category: "philippine_finance",
  },
  {
    name: "UnionBank",
    keywords: ["unionbank", "ubp"],
    officialDomains: ["unionbankph.com"],
    category: "philippine_finance",
  },

  // Philippine Government Agencies
  {
    name: "PhilHealth",
    keywords: ["philhealth"],
    officialDomains: ["philhealth.gov.ph"],
    category: "philippine_gov",
  },
  {
    name: "Social Security System (SSS)",
    keywords: ["sss", "sssgov"],
    officialDomains: ["sss.gov.ph"],
    category: "philippine_gov",
  },
  {
    name: "Pag-IBIG Fund",
    keywords: ["pagibig", "pagibigfund"],
    officialDomains: ["pagibigfund.gov.ph", "pagibigfundservices.com"],
    category: "philippine_gov",
  },
  {
    name: "LTO",
    keywords: ["ltoportal", "ltogov"],
    officialDomains: ["lto.gov.ph", "ltoms.lto.gov.ph"],
    category: "philippine_gov",
  },
  {
    name: "BIR",
    keywords: ["birgov", "efps"],
    officialDomains: ["bir.gov.ph"],
    category: "philippine_gov",
  },

  // Philippine Telco & Couriers
  {
    name: "Globe",
    keywords: ["globe", "globetelecom", "oneglobe"],
    officialDomains: ["globe.com.ph"],
    category: "philippine_telco",
  },
  {
    name: "Smart",
    keywords: ["smart", "smartpadala", "giga"],
    officialDomains: ["smart.com.ph"],
    category: "philippine_telco",
  },
  {
    name: "PLDT",
    keywords: ["pldt", "pldthome"],
    officialDomains: ["pldt.com.ph", "pldthome.com"],
    category: "philippine_telco",
  },
  {
    name: "LBC Express",
    keywords: ["lbcexpress", "lbc"],
    officialDomains: ["lbcexpress.com"],
    category: "philippine_telco",
  },
  {
    name: "JRS Express",
    keywords: ["jrsexpress", "jrs"],
    officialDomains: ["jrs-express.com"],
    category: "philippine_telco",
  },
  {
    name: "Grab",
    keywords: ["grab", "grabpay"],
    officialDomains: ["grab.com"],
    category: "philippine_telco",
  },

  // E-Commerce
  {
    name: "Shopee",
    keywords: ["shopee", "shopeepay"],
    officialDomains: ["shopee.ph", "shopee.com"],
    category: "e_commerce",
  },
  {
    name: "Lazada",
    keywords: ["lazada", "lazpay"],
    officialDomains: ["lazada.com.ph", "lazada.com"],
    category: "e_commerce",
  },

  // Global Tech & Payments
  {
    name: "Google",
    keywords: ["google", "gmail", "googleplay"],
    officialDomains: ["google.com", "google.com.ph", "gmail.com"],
    category: "global_tech",
  },
  {
    name: "Facebook / Meta",
    keywords: ["facebook", "meta", "fblogin"],
    officialDomains: ["facebook.com", "meta.com"],
    category: "global_tech",
  },
  {
    name: "Instagram",
    keywords: ["instagram"],
    officialDomains: ["instagram.com"],
    category: "global_tech",
  },
  {
    name: "WhatsApp",
    keywords: ["whatsapp"],
    officialDomains: ["whatsapp.com"],
    category: "global_tech",
  },
  {
    name: "TikTok",
    keywords: ["tiktok"],
    officialDomains: ["tiktok.com"],
    category: "global_tech",
  },
  {
    name: "Microsoft",
    keywords: ["microsoft", "office365", "outlook", "live"],
    officialDomains: ["microsoft.com", "office.com", "live.com"],
    category: "global_tech",
  },
  {
    name: "Apple",
    keywords: ["apple", "icloud", "appleid"],
    officialDomains: ["apple.com", "icloud.com"],
    category: "global_tech",
  },
  {
    name: "Amazon",
    keywords: ["amazon", "aws"],
    officialDomains: ["amazon.com"],
    category: "global_tech",
  },
  {
    name: "Netflix",
    keywords: ["netflix"],
    officialDomains: ["netflix.com"],
    category: "global_tech",
  },
  {
    name: "PayPal",
    keywords: ["paypal"],
    officialDomains: ["paypal.com"],
    category: "global_tech",
  },
  {
    name: "DHL",
    keywords: ["dhl", "dhlexpress"],
    officialDomains: ["dhl.com"],
    category: "global_tech",
  },
  {
    name: "Roblox",
    keywords: ["roblox", "robux"],
    officialDomains: ["roblox.com"],
    category: "global_tech",
  },
  {
    name: "Discord",
    keywords: ["discord", "discordnitro"],
    officialDomains: ["discord.com", "discord.gg"],
    category: "global_tech",
  },
  {
    name: "Steam",
    keywords: ["steam", "steampowered", "steamcommunity"],
    officialDomains: ["steampowered.com", "steamcommunity.com"],
    category: "global_tech",
  },
];

export interface BrandMatchResult {
  isImpersonating: boolean;
  isTyposquat: boolean;
  matchedBrand?: string;
  officialDomain?: string;
  reason?: string;
}

export function checkBrandImpersonation(
  hostname: string,
  pathname: string,
  registrableDomain: string
): BrandMatchResult {
  const cleanHost = hostname.toLowerCase();
  const cleanPath = pathname.toLowerCase();
  const cleanDomain = registrableDomain.toLowerCase();

  for (const brand of MONITORED_BRANDS) {
    const isOfficial = brand.officialDomains.some(
      (dom) => cleanDomain === dom || cleanHost.endsWith(`.${dom}`)
    );

    // If it's the verified official domain, no impersonation
    if (isOfficial) {
      continue;
    }

    // 1. Keyword impersonation in hostname or path
    for (const kw of brand.keywords) {
      // Must match whole word or separated by hyphen/dot/slash
      const hostHasKeyword = cleanHost.includes(kw);
      const pathHasKeyword = cleanPath.includes(`/${kw}`) || cleanPath.includes(`-${kw}`);

      if (hostHasKeyword || pathHasKeyword) {
        return {
          isImpersonating: true,
          isTyposquat: false,
          matchedBrand: brand.name,
          officialDomain: brand.officialDomains[0],
          reason: `URL contains the name of ${brand.name}, but destination (${registrableDomain}) is not their official website (${brand.officialDomains[0]}).`,
        };
      }
    }

    // 2. Typosquat check (Levenshtein distance <= 2 against official domains)
    for (const official of brand.officialDomains) {
      // Strip TLD for core name comparison (e.g. "paypal" vs "paypa1")
      const officialCore = official.split(".")[0];
      const domainCore = cleanDomain.split(".")[0];

      if (domainCore.length >= 4 && officialCore.length >= 4) {
        const dist = distance(domainCore, officialCore);
        if (dist > 0 && dist <= 2) {
          return {
            isImpersonating: true,
            isTyposquat: true,
            matchedBrand: brand.name,
            officialDomain: official,
            reason: `Domain "${registrableDomain}" closely mimics "${official}" with visual character substitutions. Possible impersonation.`,
          };
        }
      }
    }
  }

  return {
    isImpersonating: false,
    isTyposquat: false,
  };
}
