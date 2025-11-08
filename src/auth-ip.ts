import { createMiddleware } from "hono/factory";
import type { Context } from "hono";

// IP allowlist - Add your allowed IPs here
const ALLOWED_IPS = new Set([
  "127.0.0.1",
  "::1",
  "::ffff:127.0.0.1",
  "24.5.56.45", // Your current public IP
  // Add more IPs as needed
]);

// IP ranges for private networks
const PRIVATE_IP_RANGES = [
  /^10\./, // 10.0.0.0/8
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
  /^192\.168\./, // 192.168.0.0/16
  /^fc00:/, // IPv6 private
  /^fd[0-9a-f]{2}:/i, // IPv6 unique local
];

function isPrivateIP(ip: string): boolean {
  return PRIVATE_IP_RANGES.some((range) => range.test(ip));
}

function getClientIP(c: Context): string | null {
  console.log(c.req.header());
  // Check common headers used by proxies and load balancers
  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    const firstIP = forwarded.split(",")[0]?.trim();
    if (firstIP) return firstIP;
  }

  const realIP = c.req.header("x-real-ip");
  if (realIP) return realIP;

  // Vercel-specific headers
  const vercelIP = c.req.header("x-vercel-forwarded-for");
  if (vercelIP) {
    const firstIP = vercelIP.split(",")[0]?.trim();
    if (firstIP) return firstIP;
  }

  // Fallback for local dev - Hono doesn't expose socket directly
  // In development, localhost requests will be allowed by private IP ranges
  return null;
}

export const ipRestrictionMiddleware = createMiddleware(async (c, next) => {
  // Skip in test environment
  if (process?.env["VITEST"]) return await next();

  if (c.req.header("Host") === "localhost:3000") return await next();

  const clientIP = getClientIP(c);

  if (!clientIP) {
    return c.text("Unable to determine IP address", 403);
  }

  // Allow if IP is in the allowlist
  if (ALLOWED_IPS.has(clientIP)) {
    return await next();
  }

  // Allow if IP is in private range
  if (isPrivateIP(clientIP)) {
    return await next();
  }

  // Block all other IPs
  console.log(`Blocked access from IP: ${clientIP}`);
  return c.text("Access denied", 403);
});
