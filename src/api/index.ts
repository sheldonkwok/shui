import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { authCheckMiddleware } from "../auth.ts";
import { plantsRouter } from "./plants.ts";

export const app = new Hono().basePath("/api").use(authCheckMiddleware).route("/plants", plantsRouter);

export type AppType = typeof app;

export const apiMiddleware = createMiddleware(async (c, next) => {
  if (!c.req.path.startsWith("/api/")) return await next();

  return app.fetch(c.req.raw);
});
