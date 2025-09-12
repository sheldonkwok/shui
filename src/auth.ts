import { createMiddleware } from "hono/factory";
import { getCookie, deleteCookie } from "hono/cookie";
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

const middleware = createMiddleware(async (c, next) => {
  // Skip auth in test environment
  if (process?.env["VITEST"]) return await next();

  const sessionData = getCookie(c, SESSION_COOKIE_NAME);

  console.log("s", sessionData);

  if (!sessionData) return c.json({ error: "Unauthorized" }, 401);

  const sealedSession = workos.userManagement.loadSealedSession({
    sessionData,
    cookiePassword,
  });

  const session = await sealedSession.authenticate();
  // If the cookie is missing, return 401
  if (!session.authenticated) {
    deleteCookie(c, SESSION_COOKIE_NAME);
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("session", session);

  await next();
  return;
});

export default { middleware };
