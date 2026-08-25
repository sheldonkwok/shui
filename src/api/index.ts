import { Hono } from "hono";
import { authCheckMiddleware } from "../auth.ts";
import { plantsRouter } from "./plants.ts";

export const app = new Hono().basePath("/api").use(authCheckMiddleware).route("/plants", plantsRouter);

export type AppType = typeof app;
