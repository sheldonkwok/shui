import { googleAuth } from "@hono/oauth-providers/google";
import type { Context } from "hono";
import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";

import { IS_DEV, IS_PREVIEW, IS_PRODUCTION, IS_TEST } from "./utils.ts";

// =============================================================================
// Configuration
// =============================================================================

const CONFIG = {
  allowedEmail: "me@sheldonk.com",
  cookieName: "auth_session",
  indicatorCookieName: "is_authenticated",
  sessionMaxAge: 60 * 60 * 24 * 30, // 30 days
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

function getGoogleAuth() {
  return googleAuth({
    client_id: getEnvOrThrow("GOOGLE_CLIENT_ID"),
    client_secret: getEnvOrThrow("GOOGLE_CLIENT_SECRET"),
    redirect_uri: IS_PRODUCTION ? "https://shui.fmj.io/auth/callback" : "http://localhost:3000/auth/callback",
    scope: ["openid", "email"],
  });
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
  deleteCookie(c, CONFIG.indicatorCookieName);
  return c.redirect("/");
}

async function handleOAuthCallback(c: Context): Promise<Response> {
  const user = c.get("user-google");
  if (!user?.email || !user.verified_email) {
    return c.text("Authentication failed", 500);
  }

  const email = user.email;
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
  setCookie(c, CONFIG.indicatorCookieName, "1", {
    secure: IS_PRODUCTION,
    maxAge: CONFIG.sessionMaxAge - 60,
    sameSite: "Lax",
  });

  return c.redirect("/");
}

// =============================================================================
// Middlewares
// =============================================================================

const authApp = new Hono()
  .basePath("/auth")
  .get("/logout", handleLogout)
  // googleAuth redirects to Google when there's no `code`, and exchanges it on the callback
  .get("/google", (c, next) => getGoogleAuth()(c, next))
  .get("/callback", (c, next) => getGoogleAuth()(c, next), handleOAuthCallback);

export const authRoutesMiddleware = createMiddleware(async (c, next) => {
  if (!c.req.path.startsWith("/auth/")) return await next();
  return authApp.fetch(c.req.raw);
});

export const previewAuthMiddleware = createMiddleware(async (c, next) => {
  await next();
  if (!getCookie(c, CONFIG.indicatorCookieName)) {
    setCookie(c, CONFIG.indicatorCookieName, "1", {
      secure: IS_PRODUCTION,
      maxAge: CONFIG.sessionMaxAge - 60,
      sameSite: "Lax",
    });
  }
});

export const authCheckMiddleware = createMiddleware(async (c, next) => {
  if (IS_TEST || IS_PREVIEW || IS_DEV) return await next();

  const email = await getSessionEmail(c);
  if (email === CONFIG.allowedEmail) return await next();

  return c.text("Unauthorized", 401);
});
