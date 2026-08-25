import { Google } from "arctic";
import type { Context } from "hono";
import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { parse as parseCookieHeader } from "hono/utils/cookie";

import { IS_DEV, IS_PREVIEW, IS_PRODUCTION, IS_TEST } from "./utils.ts";

// =============================================================================
// Configuration
// =============================================================================

const CONFIG = {
  allowedEmail: "me@sheldonk.com",
  cookieName: "auth_session",
  stateCookieName: "oauth_state",
  verifierCookieName: "oauth_verifier",
  sessionMaxAge: 60 * 60 * 24 * 30, // 30 days
  oauthCookieMaxAge: 60 * 10, // 10 minutes
} as const;

// =============================================================================
// Environment Helpers
// =============================================================================

function getEnvOrThrow(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`${key} must be set`);
  return value;
}

const authSecret = getEnvOrThrow("AUTH_SECRET");

function getGoogle(): Google {
  const redirectUri = IS_PRODUCTION
    ? "https://shui.fmj.io/auth/callback"
    : "http://localhost:3000/auth/callback";

  return new Google(getEnvOrThrow("GOOGLE_CLIENT_ID"), getEnvOrThrow("GOOGLE_CLIENT_SECRET"), redirectUri);
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

async function getSessionEmail(headers: Readonly<Record<string, string>>): Promise<string | null> {
  const cookie = parseCookieHeader(headers.cookie ?? "", CONFIG.cookieName)[CONFIG.cookieName];
  if (!cookie) return null;

  try {
    return await verifySignedValue(cookie);
  } catch {
    return null;
  }
}

/**
 * Whether the request carries a valid session. Shared by the API middleware and
 * by server components, which read headers via Waku's `unstable_getHeaders`.
 */
export async function isLoggedIn(headers: Readonly<Record<string, string>>): Promise<boolean> {
  if (IS_TEST || IS_PREVIEW || IS_DEV) return true;

  return (await getSessionEmail(headers)) === CONFIG.allowedEmail;
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
    secure: IS_PRODUCTION,
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
      secure: IS_PRODUCTION,
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
// Routes & Middleware
// =============================================================================

export const authApp = new Hono()
  .basePath("/auth")
  .get("/logout", handleLogout)
  .get("/google", handleGoogleAuth)
  .get("/callback", handleOAuthCallback);

export const authCheckMiddleware = createMiddleware(async (c, next) => {
  if (await isLoggedIn(c.req.header())) return await next();

  return c.text("Unauthorized", 401);
});
