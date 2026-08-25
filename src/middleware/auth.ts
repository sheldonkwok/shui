import type { MiddlewareHandler } from "hono";
import { authApp } from "../auth.ts";

/** Hands `/auth/*` to the Google OAuth routes. */
export default (): MiddlewareHandler => async (c, next) => {
  if (!c.req.path.startsWith("/auth/")) return await next();

  return authApp.fetch(c.req.raw);
};
