import { NextRequest } from "next/server";

/**
 * Validates the Origin header for state-changing HTTP requests (POST, PUT, PATCH, DELETE).
 * Protects against cross-site request forgery when using cookie-based authentication.
 */
export function verifyOrigin(request: NextRequest): boolean {
  // Safe HTTP methods do not mutate state
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    return true;
  }

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  // If no origin header is present (e.g. server-to-server or same-origin direct request in some clients)
  if (!origin) {
    // Check referer header as fallback
    const referer = request.headers.get("referer");
    if (!referer) {
      // For mobile PWAs and same-site API routes, if neither origin nor referer is sent, verify sec-fetch-site
      const secFetchSite = request.headers.get("sec-fetch-site");
      if (secFetchSite && ["cross-site"].includes(secFetchSite)) {
        return false;
      }
      return true;
    }

    try {
      const refererUrl = new URL(referer);
      return refererUrl.host === host;
    } catch {
      return false;
    }
  }

  try {
    const originUrl = new URL(origin);

    // Allow requests matching current Host header
    if (originUrl.host === host) {
      return true;
    }

    // Allow configured app URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (appUrl) {
      const configuredUrl = new URL(appUrl);
      if (originUrl.host === configuredUrl.host) {
        return true;
      }
    }

    // Allow Vercel preview deployments for this project
    if (originUrl.hostname.endsWith(".vercel.app")) {
      return true;
    }

    // Allow localhost during local development
    if (originUrl.hostname === "localhost" || originUrl.hostname === "127.0.0.1") {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
