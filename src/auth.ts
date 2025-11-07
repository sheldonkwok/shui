import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import { WorkOS } from "@workos-inc/node";

const SESSION_COOKIE_NAME = "session";
const cookiePassword = "testtesttesttesttesttesttesttesttesttest"; // change

export interface SessionData {
  user: {
    firstName: string | null;
    lastName: string | null;
  };
}
declare module "hono" {
  interface ContextVariableMap {
    session: SessionData;
  }
}

const clientId = process.env["WORKOS_CLIENT_ID"]!;
const workos = new WorkOS(process.env["WORKOS_API_KEY"], { clientId });

const routes = new Hono()
  .get("/login", async (c) => {
    const provider = "GoogleOAuth";
    const redirectUri =
      process.env["NODE_ENV"] === "production"
        ? `https://${c.req.header("host")}/callback`
        : "http://localhost:3000/callback";

    const authorizationUrl = workos.sso.getAuthorizationUrl({
      provider,
      redirectUri,
      clientId,
    });

    return c.redirect(authorizationUrl);
  })
  .get("/callback", async (c) => {
    const code = c.req.query("code")!;

    const { sealedSession } = await workos.userManagement.authenticateWithCode({
      code,
      clientId,
      session: {
        sealSession: true,
        cookiePassword,
      },
    });

    // Store the session in a cookie
    setCookie(c, SESSION_COOKIE_NAME, sealedSession!);

    return c.redirect("/");
  });

const middleware = createMiddleware(async (c, next) => {
  // Skip auth in test environment
  if (process?.env["VITEST"]) return await next();

  const sessionData = getCookie(c, SESSION_COOKIE_NAME);
  if (!sessionData) return c.redirect("/login");

  const sealedSession = workos.userManagement.loadSealedSession({
    sessionData,
    cookiePassword,
  });

  const session = await sealedSession.authenticate();
  // If the cookie is missing, redirect to login
  if (!session.authenticated) {
    deleteCookie(c, SESSION_COOKIE_NAME);
    return c.redirect("/login");
  }

  c.set("session", session);

  await next();
  return;
});

export default { routes, middleware };
