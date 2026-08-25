import type { MiddlewareHandler } from "hono";
import { app } from "../api/index.ts";

/** Hands `/api/*` to the Hono app that also backs the typed client in `api/client.ts`. */
export default (): MiddlewareHandler => async (c, next) => {
  if (!c.req.path.startsWith("/api/")) return await next();

  return app.fetch(c.req.raw);
};
