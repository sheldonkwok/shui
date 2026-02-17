import { Google } from "arctic";
import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";

import { IS_TEST } from "./utils.ts";

// =============================================================================
// Configuration
// =============================================================================

const CONFIG = {
  allowedEmail: "me@sheldonk.com",
  allowedIPs: new Set(["24.23.250.55"]),
  cookieName: "auth_session",
  stateCookieName: "oauth_state",
  verifierCookieName: "oauth_verifier",
  sessionMaxAge: 60 * 60 * 24 * 30, // 30 days
  oauthCookieMaxAge: 60 * 10, // 10 minutes
} as const;

const PRIVATE_IP_RANGES = [
  /^10\./, // 10.0.0.0/8
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
  /^192\.168\./, // 192.168.0.0/16
  /^fc00:/, // IPv6 private
  /^fd[0-9a-f]{2}:/i, // IPv6 unique local
];

// =============================================================================
// Environment Helpers
// =============================================================================

function getEnvOrThrow(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`${key} must be set`);
  return value;
}

const isProduction = process.env.VERCEL_ENV === "production";
const isPreview = process.env.VERCEL_ENV === "preview";
const authSecret = getEnvOrThrow("AUTH_SECRET");

function getGoogle(): Google {
  const redirectUri = isProduction
    ? "https://shui.fmj.io/auth/callback"
    : "http://localhost:3000/auth/callback";

  return new Google(getEnvOrThrow("GOOGLE_CLIENT_ID"), getEnvOrThrow("GOOGLE_CLIENT_SECRET"), redirectUri);
}

// =============================================================================
// IP Checking
// =============================================================================

function getClientIP(c: Context): string | null {
  for (const header of ["x-forwarded-for", "x-real-ip", "x-vercel-forwarded-for"]) {
    const value = c.req.header(header);
    if (value) {
      const ip = value.split(",")[0]?.trim();
      if (ip) return ip;
    }
  }
  return null;
}

function isIPAllowed(c: Context): boolean {
  const host = c.req.header("Host") ?? "";
  if (host === "localhost:3000" || /^192\.168\.\d+\.\d+(:\d+)?$/.test(host)) {
    return true;
  }

  const clientIP = getClientIP(c);
  if (!clientIP) return false;

  return CONFIG.allowedIPs.has(clientIP) || PRIVATE_IP_RANGES.some((range) => range.test(clientIP));
}

// =============================================================================
// Cookie Signing
// =============================================================================

async function signValue(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(authSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return `${value}.${signatureBase64}`;
}

async function verifySignedValue(signedValue: string): Promise<string | null> {
  const lastDotIndex = signedValue.lastIndexOf(".");
  if (lastDotIndex === -1) return null;

  const value = signedValue.slice(0, lastDotIndex);
  const expectedSigned = await signValue(value);

  return signedValue === expectedSigned ? value : null;
}

async function getSessionEmail(c: Context): Promise<string | null> {
  const cookie = getCookie(c, CONFIG.cookieName);
  if (!cookie) return null;

  try {
    return await verifySignedValue(cookie);
  } catch {
    return null;
  }
}

// =============================================================================
// Route Handlers
// =============================================================================

function handleLogout(c: Context): Response {
  deleteCookie(c, CONFIG.cookieName);
  return c.redirect("/");
}

function generateCodeVerifier(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function handleGoogleAuth(c: Context): Response {
  const google = getGoogle();
  const state = crypto.randomUUID();
  const codeVerifier = generateCodeVerifier();
  const url = google.createAuthorizationURL(state, codeVerifier, ["openid", "email"]);

  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    maxAge: CONFIG.oauthCookieMaxAge,
    sameSite: "Lax" as const,
  };

  setCookie(c, CONFIG.stateCookieName, state, cookieOptions);
  setCookie(c, CONFIG.verifierCookieName, codeVerifier, cookieOptions);

  return c.redirect(url.toString());
}

async function handleOAuthCallback(c: Context): Promise<Response> {
  const url = new URL(c.req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = getCookie(c, CONFIG.stateCookieName);
  const codeVerifier = getCookie(c, CONFIG.verifierCookieName);

  // Clean up OAuth cookies
  deleteCookie(c, CONFIG.stateCookieName);
  deleteCookie(c, CONFIG.verifierCookieName);

  if (!code || !state || !storedState || state !== storedState || !codeVerifier) {
    return c.text("Invalid OAuth state", 400);
  }

  try {
    const tokens = await getGoogle().validateAuthorizationCode(code, codeVerifier);
    const idToken = tokens.idToken();
    const payload = JSON.parse(atob(idToken.split(".")[1]!));
    const email = payload.email as string;

    if (email !== CONFIG.allowedEmail) {
      return c.text(`Access denied. Email ${email} is not authorized.`, 403);
    }

    const signedEmail = await signValue(email);
    setCookie(c, CONFIG.cookieName, signedEmail, {
      httpOnly: true,
      secure: isProduction,
      maxAge: CONFIG.sessionMaxAge,
      sameSite: "Lax",
    });

    return c.redirect("/");
  } catch (error) {
    console.error("OAuth error:", error);
    return c.text("Authentication failed", 500);
  }
}

// =============================================================================
// Main Middleware
// =============================================================================

export const authMiddleware = createMiddleware(async (c, next) => {
  // Skip in test/preview environments
  if (IS_TEST || isPreview) return await next();

  const path = new URL(c.req.url).pathname;

  // Handle auth routes
  if (path === "/auth/logout") return handleLogout(c);
  if (path === "/auth/google") return handleGoogleAuth(c);
  if (path === "/auth/callback") return await handleOAuthCallback(c);

  // Check access: IP first, then session cookie
  if (isIPAllowed(c)) return await next();

  const email = await getSessionEmail(c);
  if (email === CONFIG.allowedEmail) return await next();

  // Not authorized - redirect to login
  return c.redirect("/auth/google");
});
