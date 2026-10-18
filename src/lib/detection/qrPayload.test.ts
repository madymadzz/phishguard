import { describe, it, expect } from "vitest";
import { analyzeNonUrlPayload } from "./qrPayload";

describe("Detection Engine: QR Payload Analyzer", () => {
  it("identifies Wi-Fi configuration payloads and rates them suspicious", () => {
    const res = analyzeNonUrlPayload("WIFI:S:FreeAirportWiFi;T:WPA;P:password123;;");
    expect(res.isNonUrl).toBe(true);
    expect(res.payloadType).toBe("Wi-Fi Configuration");
    expect(res.riskLevel).toBe("suspicious");
    expect(res.riskScore).toBe(45);
    expect(res.reasons.some((r) => r.code === "QR_WIFI_CONFIG")).toBe(true);
  });

  it("identifies payment deep links and rates them suspicious", () => {
    const upiRes = analyzeNonUrlPayload("upi://pay?pa=merchant@upi&pn=Store&am=500");
    expect(upiRes.isNonUrl).toBe(true);
    expect(upiRes.payloadType).toBe("Payment Deep Link");
    expect(upiRes.riskLevel).toBe("suspicious");
    expect(upiRes.riskScore).toBe(55);

    const gcashRes = analyzeNonUrlPayload("gcash://transfer?to=09123456789");
    expect(gcashRes.isNonUrl).toBe(true);
    expect(gcashRes.payloadType).toBe("Payment Deep Link");
  });

  it("identifies telephone call links", () => {
    const res = analyzeNonUrlPayload("tel:+639171234567");
    expect(res.isNonUrl).toBe(true);
    expect(res.payloadType).toBe("Phone Number");
    expect(res.riskLevel).toBe("safe");
  });

  it("identifies SMS message links", () => {
    const res = analyzeNonUrlPayload("smsto:09171234567:Claim your reward now");
    expect(res.isNonUrl).toBe(true);
    expect(res.payloadType).toBe("SMS Message");
    expect(res.riskLevel).toBe("safe");
  });

  it("identifies mailto email links", () => {
    const res = analyzeNonUrlPayload("mailto:security@tip.edu.ph?subject=Inquiry");
    expect(res.isNonUrl).toBe(true);
    expect(res.payloadType).toBe("Email Draft");
    expect(res.riskLevel).toBe("safe");
  });

  it("identifies vCard contact cards", () => {
    const res = analyzeNonUrlPayload("BEGIN:VCARD\nVERSION:3.0\nFN:John Doe\nTEL:+639123456789\nEND:VCARD");
    expect(res.isNonUrl).toBe(true);
    expect(res.payloadType).toBe("Contact Card (vCard)");
    expect(res.riskLevel).toBe("safe");
  });

  it("identifies static plain text", () => {
    const res = analyzeNonUrlPayload("Just a simple room 402 code: 99482");
    expect(res.isNonUrl).toBe(true);
    expect(res.payloadType).toBe("Plain Text Note");
    expect(res.riskLevel).toBe("safe");
  });

  it("returns isNonUrl = false for standard web URLs", () => {
    const res1 = analyzeNonUrlPayload("https://tip.edu.ph/programs");
    expect(res1.isNonUrl).toBe(false);

    const res2 = analyzeNonUrlPayload("http://phishing-site.example.top/login");
    expect(res2.isNonUrl).toBe(false);

    const res3 = analyzeNonUrlPayload("google.com/search?q=cybersecurity");
    expect(res3.isNonUrl).toBe(false);
  });
});
