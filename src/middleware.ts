import { defineMiddleware } from "astro:middleware";
import { WorkOS } from "@workos-inc/node";

const SESSION_COOKIE_NAME = "session";
const cookiePassword = "testtesttesttesttesttesttesttesttesttest"; // change

export interface SessionData {
  user: {
    firstName: string | null;
    lastName: string | null;
  };
}

const clientId = process.env["WORKOS_CLIENT_ID"]!;
const workos = new WorkOS(process.env["WORKOS_API_KEY"], { clientId });

export const onRequest = defineMiddleware(async (context, next) => {
  // Skip auth in test environment
  if (process?.env["VITEST"]) return await next();

  const { url, cookies, redirect } = context;

  // Skip auth for login and callback routes
  if (url.pathname === "/login" || url.pathname === "/callback") {
    return await next();
  }

  const sessionData = cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionData) {
    return redirect("/login");
  }

  try {
    const sealedSession = workos.userManagement.loadSealedSession({
      sessionData,
      cookiePassword,
    });

    const session = await sealedSession.authenticate();

    // If the session is not authenticated, redirect to login
    if (!session.authenticated) {
      cookies.delete(SESSION_COOKIE_NAME);
      return redirect("/login");
    }

    // Store session data in locals for use in pages/components
    context.locals.session = session;
  } catch (error) {
    console.error("Auth error:", error);
    cookies.delete(SESSION_COOKIE_NAME);
    return redirect("/login");
  }

  return await next();
});
