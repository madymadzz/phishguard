import { assertSafeUrlTarget } from "./ssrf";

const KNOWN_SHORTENERS = new Set([
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "is.gd",
  "cutt.ly",
  "rebrand.ly",
  "shorturl.at",
  "ow.ly",
  "buff.ly",
  "tiny.cc",
  "v.gd",
  "rb.gy",
  "qr.ae",
]);

export interface UnshortenResult {
  finalUrl: string;
  redirectChain: string[];
  isShortener: boolean;
  hops: number;
  ssrfBlocked: boolean;
  error?: string;
}

export async function unshortenUrl(initialUrl: string, maxHops = 5, timeoutMs = 4000): Promise<UnshortenResult> {
  const redirectChain: string[] = [initialUrl];
  let currentUrl = initialUrl;
  let isShortener = false;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    for (let hop = 0; hop < maxHops; hop++) {
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(currentUrl);
      } catch {
        break;
      }

      // Check if hostname is a known shortener
      const host = parsedUrl.hostname.toLowerCase();
      if (KNOWN_SHORTENERS.has(host) || Array.from(KNOWN_SHORTENERS).some((s) => host.endsWith(`.${s}`))) {
        isShortener = true;
      }

      // Strict SSRF verification on every hop
      const isSafe = await assertSafeUrlTarget(currentUrl);
      if (!isSafe) {
        return {
          finalUrl: currentUrl,
          redirectChain,
          isShortener,
          hops: hop,
          ssrfBlocked: true,
          error: "Redirect target blocked by SSRF protection filter.",
        };
      }

      // Attempt HEAD request first to fetch Location header without body
      let response: Response;
      try {
        response = await fetch(currentUrl, {
          method: "HEAD",
          redirect: "manual",
          signal: controller.signal,
          headers: {
            "User-Agent": "PhishGuard-Security-Bot/1.0",
          },
        });
      } catch {
        // Fall back to GET if HEAD method is disallowed by server
        try {
          response = await fetch(currentUrl, {
            method: "GET",
            redirect: "manual",
            signal: controller.signal,
            headers: {
              "User-Agent": "PhishGuard-Security-Bot/1.0",
            },
          });
        } catch {
          break;
        }
      }

      // Check for redirect status (301, 302, 303, 307, 308)
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) {
          break;
        }

        // Resolve relative redirects against current URL
        const nextUrl = new URL(location, currentUrl).toString();

        // Prevent infinite redirect loops
        if (redirectChain.includes(nextUrl)) {
          break;
        }

        redirectChain.push(nextUrl);
        currentUrl = nextUrl;
      } else {
        // Destination reached
        break;
      }
    }

    return {
      finalUrl: currentUrl,
      redirectChain,
      isShortener,
      hops: redirectChain.length - 1,
      ssrfBlocked: false,
    };
  } catch (err) {
    return {
      finalUrl: currentUrl,
      redirectChain,
      isShortener,
      hops: redirectChain.length - 1,
      ssrfBlocked: false,
      error: err instanceof Error ? err.message : "Unshortening timed out",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
