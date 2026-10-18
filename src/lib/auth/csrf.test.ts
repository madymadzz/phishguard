import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { verifyOrigin } from "./csrf";

describe("CSRF & Origin Verification", () => {
  const originalEnv = process.env.NEXT_PUBLIC_APP_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = "https://phishguard.security.app";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = originalEnv;
  });

  it("allows safe HTTP methods unconditionally (GET, HEAD, OPTIONS)", () => {
    const getReq = new NextRequest("https://phishguard.security.app/api/scan", {
      method: "GET",
      headers: { origin: "https://evil-attacker.com" },
    });
    expect(verifyOrigin(getReq)).toBe(true);

    const headReq = new NextRequest("https://phishguard.security.app/api/scan", {
      method: "HEAD",
    });
    expect(verifyOrigin(headReq)).toBe(true);

    const optionsReq = new NextRequest("https://phishguard.security.app/api/scan", {
      method: "OPTIONS",
    });
    expect(verifyOrigin(optionsReq)).toBe(true);
  });

  it("allows POST requests matching Host header", () => {
    const req = new NextRequest("https://phishguard.com/api/scan", {
      method: "POST",
      headers: {
        host: "phishguard.com",
        origin: "https://phishguard.com",
      },
    });
    expect(verifyOrigin(req)).toBe(true);
  });

  it("allows POST requests matching NEXT_PUBLIC_APP_URL", () => {
    const req = new NextRequest("https://api-gateway.internal/api/scan", {
      method: "POST",
      headers: {
        host: "api-gateway.internal",
        origin: "https://phishguard.security.app",
      },
    });
    expect(verifyOrigin(req)).toBe(true);
  });

  it("allows Vercel preview and production deployments (*.vercel.app)", () => {
    const req = new NextRequest("https://phishguard-three-rho.vercel.app/api/scan", {
      method: "POST",
      headers: {
        host: "phishguard-three-rho.vercel.app",
        origin: "https://phishguard-preview-git-feature.vercel.app",
      },
    });
    expect(verifyOrigin(req)).toBe(true);
  });

  it("allows localhost origins during local development", () => {
    const reqLocalhost = new NextRequest("http://localhost:3000/api/scan", {
      method: "POST",
      headers: {
        host: "localhost:3000",
        origin: "http://localhost:3000",
      },
    });
    expect(verifyOrigin(reqLocalhost)).toBe(true);

    const reqIp = new NextRequest("http://127.0.0.1:3000/api/scan", {
      method: "POST",
      headers: {
        host: "127.0.0.1:3000",
        origin: "http://127.0.0.1:3000",
      },
    });
    expect(verifyOrigin(reqIp)).toBe(true);
  });

  it("rejects malicious cross-site origins", () => {
    const req = new NextRequest("https://phishguard.security.app/api/scan", {
      method: "POST",
      headers: {
        host: "phishguard.security.app",
        origin: "https://attacker-stealer.xyz",
      },
    });
    expect(verifyOrigin(req)).toBe(false);
  });

  it("falls back to Referer header when Origin is absent", () => {
    const validRefererReq = new NextRequest("https://phishguard.com/api/scan", {
      method: "POST",
      headers: {
        host: "phishguard.com",
        referer: "https://phishguard.com/scan",
      },
    });
    expect(verifyOrigin(validRefererReq)).toBe(true);

    const invalidRefererReq = new NextRequest("https://phishguard.com/api/scan", {
      method: "POST",
      headers: {
        host: "phishguard.com",
        referer: "https://evil-site.com/attack.html",
      },
    });
    expect(verifyOrigin(invalidRefererReq)).toBe(false);
  });

  it("rejects cross-site requests identified by sec-fetch-site when Origin and Referer are absent", () => {
    const req = new NextRequest("https://phishguard.com/api/scan", {
      method: "POST",
      headers: {
        host: "phishguard.com",
        "sec-fetch-site": "cross-site",
      },
    });
    expect(verifyOrigin(req)).toBe(false);
  });

  it("handles malformed Origin header gracefully without crashing", () => {
    const req = new NextRequest("https://phishguard.com/api/scan", {
      method: "POST",
      headers: {
        host: "phishguard.com",
        origin: "not-a-valid-url::8888",
      },
    });
    expect(verifyOrigin(req)).toBe(false);
  });
});
