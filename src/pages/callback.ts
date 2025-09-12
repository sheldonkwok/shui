import type { APIRoute } from "astro";
import { WorkOS } from "@workos-inc/node";

const SESSION_COOKIE_NAME = "session";
const cookiePassword = "testtesttesttesttesttesttesttesttesttest"; // change

const clientId = process.env["WORKOS_CLIENT_ID"]!;
const workos = new WorkOS(process.env["WORKOS_API_KEY"], { clientId });

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const code = url.searchParams.get("code");
  
  if (!code) {
    return redirect("/login");
  }

  try {
    const { sealedSession } = await workos.userManagement.authenticateWithCode({
      code,
      clientId,
      session: {
        sealSession: true,
        cookiePassword,
      },
    });

    // Store the session in a cookie
    if (sealedSession) {
      cookies.set(SESSION_COOKIE_NAME, sealedSession, {
        httpOnly: true,
        secure: process.env["NODE_ENV"] === "production",
        sameSite: "lax",
        path: "/",
      });
    }

    return redirect("/");
  } catch (error) {
    console.error("Callback error:", error);
    return redirect("/login");
  }
};