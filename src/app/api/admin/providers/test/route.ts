import { NextResponse } from "next/server";
import { requireAdminApi, logAdminAction } from "@/lib/auth/admin";
import { GoogleGenAI } from "@google/genai";

export async function POST() {
  const authCheck = await requireAdminApi();
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  const results: {
    safeBrowsing: { ok: boolean; latencyMs: number; message: string };
    urlhaus: { ok: boolean; latencyMs: number; message: string };
    gemini: { ok: boolean; latencyMs: number; message: string };
  } = {
    safeBrowsing: { ok: false, latencyMs: 0, message: "Unconfigured" },
    urlhaus: { ok: false, latencyMs: 0, message: "Unconfigured" },
    gemini: { ok: false, latencyMs: 0, message: "Unconfigured" },
  };

  // 1. Test Google Safe Browsing
  const gsbKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (gsbKey) {
    const t0 = performance.now();
    try {
      const res = await fetch(
        `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${gsbKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client: { clientId: "phishguard-admin-test", clientVersion: "1.0.0" },
            threatInfo: {
              threatTypes: ["MALWARE", "SOCIAL_ENGINEERING"],
              platformTypes: ["ANY_PLATFORM"],
              threatEntryTypes: ["URL"],
              threatEntries: [{ url: "http://malware.testing.google.test/testing/malware/" }],
            },
          }),
          signal: AbortSignal.timeout(5000),
        }
      );
      const latency = Math.round(performance.now() - t0);
      if (res.ok) {
        results.safeBrowsing = {
          ok: true,
          latencyMs: latency,
          message: "Connected (Threat sample recognized)",
        };
      } else {
        const text = await res.text();
        results.safeBrowsing = {
          ok: false,
          latencyMs: latency,
          message: `HTTP ${res.status}: ${text.slice(0, 100)}`,
        };
      }
    } catch (err: unknown) {
      results.safeBrowsing = {
        ok: false,
        latencyMs: Math.round(performance.now() - t0),
        message: err instanceof Error ? err.message : "Connection timeout",
      };
    }
  }

  // 2. Test URLhaus
  const urlhausKey = process.env.URLHAUS_AUTH_KEY;
  if (urlhausKey) {
    const t0 = performance.now();
    try {
      const res = await fetch("https://urlhaus-api.abuse.ch/v1/url/", {
        method: "POST",
        headers: {
          "Auth-Key": urlhausKey,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ url: "https://google.com" }),
        signal: AbortSignal.timeout(5000),
      });
      const latency = Math.round(performance.now() - t0);
      if (res.ok) {
        const data = await res.json();
        results.urlhaus = {
          ok: true,
          latencyMs: latency,
          message: `Connected (query_status: ${data.query_status || "ok"})`,
        };
      } else {
        results.urlhaus = {
          ok: false,
          latencyMs: latency,
          message: `HTTP ${res.status}`,
        };
      }
    } catch (err: unknown) {
      results.urlhaus = {
        ok: false,
        latencyMs: Math.round(performance.now() - t0),
        message: err instanceof Error ? err.message : "Connection timeout",
      };
    }
  }

  // 3. Test Gemini
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    const t0 = performance.now();
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
      const response = await ai.models.generateContent({
        model,
        contents: "Respond with the single word: OK",
      });
      const latency = Math.round(performance.now() - t0);
      if (response && response.text) {
        results.gemini = {
          ok: true,
          latencyMs: latency,
          message: `Connected (${model})`,
        };
      } else {
        results.gemini = {
          ok: false,
          latencyMs: latency,
          message: "No content returned",
        };
      }
    } catch (err: unknown) {
      results.gemini = {
        ok: false,
        latencyMs: Math.round(performance.now() - t0),
        message: err instanceof Error ? err.message : "Generation failed",
      };
    }
  }

  // Record test in audit log
  await logAdminAction({
    actorId: authCheck.user.id,
    action: "provider_diagnostics_tested",
    targetType: "system_providers",
    metadata: { results },
  });

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    results,
  });
}
