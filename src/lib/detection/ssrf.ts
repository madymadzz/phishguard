import dns from "dns/promises";
import net from "net";

/**
 * Check whether an IP string is in a reserved, loopback, private, or metadata range.
 */
export function isPrivateOrReservedIp(ip: string): boolean {
  if (!net.isIP(ip)) {
    return false;
  }

  // IPv4 checks
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    const [p0, p1] = parts;

    // 0.0.0.0/8 (Current network)
    if (p0 === 0) return true;
    // 10.0.0.0/8 (Private network)
    if (p0 === 10) return true;
    // 127.0.0.0/8 (Loopback)
    if (p0 === 127) return true;
    // 169.254.0.0/16 (Link-local & Cloud Metadata 169.254.169.254)
    if (p0 === 169 && p1 === 254) return true;
    // 172.16.0.0/12 (Private network 172.16.0.0 - 172.31.255.255)
    if (p0 === 172 && p1 >= 16 && p1 <= 31) return true;
    // 192.168.0.0/16 (Private network)
    if (p0 === 192 && p1 === 168) return true;
    // 100.64.0.0/10 (Carrier-grade NAT)
    if (p0 === 100 && p1 >= 64 && p1 <= 127) return true;
    // 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24 (TEST-NET)
    // 224.0.0.0/4 (Multicast)
    if (p0 >= 224) return true;

    return false;
  }

  // IPv6 checks
  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    // ::1 (Loopback)
    if (normalized === "::1" || normalized === "0:0:0:0:0:0:0:1") return true;
    // :: (Unspecified)
    if (normalized === "::" || normalized === "0:0:0:0:0:0:0:0") return true;
    // fc00::/7 (Unique local address)
    if (/^f[cd][0-9a-f]{2}:/i.test(normalized)) return true;
    // fe80::/10 (Link-local unicast)
    if (/^fe[89ab][0-9a-f]:/i.test(normalized)) return true;
    // ::ffff:127.0.0.1 (IPv4-mapped IPv6)
    if (normalized.startsWith("::ffff:")) {
      const ipv4Part = normalized.substring(7);
      if (net.isIPv4(ipv4Part)) {
        return isPrivateOrReservedIp(ipv4Part);
      }
    }
  }

  return false;
}

export function isAllowedPort(port: number): boolean {
  return port === 80 || port === 443 || port === 8080 || port === 8443;
}

/**
 * Validate that a URL target host does not resolve to private or internal addresses.
 */
export async function assertSafeUrlTarget(urlStr: string): Promise<boolean> {
  try {
    const url = new URL(urlStr);

    // Only allow HTTP and HTTPS
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false;
    }

    // Only allow standard ports 80, 443, 8080, 8443
    const port = url.port ? parseInt(url.port, 10) : (url.protocol === "https:" ? 443 : 80);
    if (!isAllowedPort(port)) {
      return false;
    }

    const hostname = url.hostname;

    // Check if hostname is direct IP
    if (net.isIP(hostname)) {
      return !isPrivateOrReservedIp(hostname);
    }

    // Resolve DNS addresses
    const records = await dns.lookup(hostname, { all: true });
    for (const record of records) {
      if (isPrivateOrReservedIp(record.address)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}
