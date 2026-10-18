import { describe, it, expect } from "vitest";
import { normalizeUrl, defangUrl } from "./normalize";
import { isPrivateOrReservedIp, isAllowedPort, assertSafeUrlTarget } from "./ssrf";
import { evaluateHeuristics } from "./heuristics";
import { evaluateRiskScore } from "./score";

describe("Detection Engine: normalizeUrl", () => {
  it("trims whitespace and prepends https:// if scheme is missing", () => {
    const res = normalizeUrl("   google.com/path  ");
    expect(res.url).toBe("https://google.com/path");
    expect(res.hostname).toBe("google.com");
  });

  it("converts uppercase hostname to lowercase and strips fragments", () => {
    const res = normalizeUrl("HTTPS://WWW.EXAMPLE.COM/Page#section");
    expect(res.url).toBe("https://www.example.com/Page");
    expect(res.hostname).toBe("www.example.com");
  });

  it("throws on dangerous pseudo-schemes", () => {
    expect(() => normalizeUrl("javascript:alert(1)")).toThrow(/Dangerous URL protocol/);
    expect(() => normalizeUrl("data:text/html,<h1>evil</h1>")).toThrow(/Dangerous URL protocol/);
    expect(() => normalizeUrl("vbscript:MsgBox(1)")).toThrow(/Dangerous URL protocol/);
  });

  it("correctly defangs URLs for safe presentation", () => {
    const defanged = defangUrl("https://phishing-site.example.com/login");
    expect(defanged).toBe("hxxps://phishing-site[.]example[.]com/login");
  });
});

describe("Detection Engine: SSRF Guard", () => {
  it("detects loopback and private IPv4 addresses", () => {
    expect(isPrivateOrReservedIp("127.0.0.1")).toBe(true);
    expect(isPrivateOrReservedIp("10.0.0.5")).toBe(true);
    expect(isPrivateOrReservedIp("172.16.1.1")).toBe(true);
    expect(isPrivateOrReservedIp("192.168.1.100")).toBe(true);
    expect(isPrivateOrReservedIp("169.254.169.254")).toBe(true); // AWS/cloud metadata
    expect(isPrivateOrReservedIp("0.0.0.0")).toBe(true);
  });

  it("detects loopback and link-local IPv6 addresses", () => {
    expect(isPrivateOrReservedIp("::1")).toBe(true);
    expect(isPrivateOrReservedIp("fe80::1")).toBe(true);
    expect(isPrivateOrReservedIp("fc00::1")).toBe(true);
  });

  it("permits standard public IPv4 addresses", () => {
    expect(isPrivateOrReservedIp("8.8.8.8")).toBe(false);
    expect(isPrivateOrReservedIp("1.1.1.1")).toBe(false);
  });

  it("allows only standard web ports (80, 443, 8080, 8443)", () => {
    expect(isAllowedPort(80)).toBe(true);
    expect(isAllowedPort(443)).toBe(true);
    expect(isAllowedPort(8080)).toBe(true);
    expect(isAllowedPort(8443)).toBe(true);
    expect(isAllowedPort(22)).toBe(false); // SSH
    expect(isAllowedPort(3306)).toBe(false); // MySQL
    expect(isAllowedPort(25)).toBe(false); // SMTP
  });

  it("blocks private targets through assertSafeUrlTarget", async () => {
    expect(await assertSafeUrlTarget("http://127.0.0.1:8080")).toBe(false);
    expect(await assertSafeUrlTarget("http://192.168.0.1/admin")).toBe(false);
    expect(await assertSafeUrlTarget("http://169.254.169.254/latest/meta-data/")).toBe(false);
  });
});

describe("Detection Engine: Heuristics", () => {
  it("flags IP address hostnames with danger severity", () => {
    const res = evaluateHeuristics("http://192.0.2.10/login");
    expect(res.signals.ip_hostname).toBe(true);
    expect(res.reasons.some((r) => r.code === "IP_HOSTNAME")).toBe(true);
    expect(res.score).toBeGreaterThanOrEqual(40);
  });

  it("detects punycode internationalized domains", () => {
    const res = evaluateHeuristics("https://xn--pple-43d.com/verify");
    expect(res.signals.punycode).toBe(true);
    expect(res.reasons.some((r) => r.code === "PUNYCODE")).toBe(true);
  });

  it("flags unencrypted HTTP and sensitive keywords", () => {
    const res = evaluateHeuristics("http://example-verify.com/login");
    expect(res.signals.not_https).toBe(true);
    expect(res.signals.phishing_keywords).toBeDefined();
    expect(res.reasons.some((r) => r.code === "NOT_HTTPS")).toBe(true);
  });

  it("detects brand typosquatting (e.g. Philippine brand GCash spoofing)", () => {
    const res = evaluateHeuristics("http://secure-login.verify-account.example.top/gcash/otp");
    expect(res.signals.brand_impersonation).toBe(true);
    expect(res.reasons.some((r) => r.code === "BRAND_IMPERSONATION" || r.code === "TYPOSQUAT_BRAND")).toBe(true);
    expect(res.score).toBeGreaterThanOrEqual(50);
  });

  it("gives low score to legitimate standard websites", () => {
    const res = evaluateHeuristics("https://tip.edu.ph/about");
    expect(res.score).toBeLessThan(30);
    expect(res.signals.brand_impersonation).toBeUndefined();
  });
});

describe("Detection Engine: Score Evaluation", () => {
  it("maps scores < 30 to SAFE", () => {
    const res = evaluateRiskScore(15);
    expect(res.riskLevel).toBe("safe");
    expect(res.displayLabel).toBe("SAFE");
    expect(res.score).toBe(15);
  });

  it("maps scores 30 to 64 to SUSPICIOUS", () => {
    const res = evaluateRiskScore(45);
    expect(res.riskLevel).toBe("suspicious");
    expect(res.displayLabel).toBe("SUSPICIOUS");
  });

  it("maps scores >= 65 to HIGH RISK", () => {
    const res = evaluateRiskScore(80);
    expect(res.riskLevel).toBe("dangerous");
    expect(res.displayLabel).toBe("HIGH RISK");
  });

  it("forces dangerous when threat feed hit occurs", () => {
    const res = evaluateRiskScore(10, true);
    expect(res.riskLevel).toBe("dangerous");
    expect(res.displayLabel).toBe("HIGH RISK");
    expect(res.score).toBe(100);
  });
});
