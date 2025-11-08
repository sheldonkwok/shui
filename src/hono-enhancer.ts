import type { Hono } from "hono";
import { ipRestrictionMiddleware } from "./auth-ip.ts";

export default function enhance(createApp: (app: Hono) => Hono) {
  return (app: Hono) => {
    app.use("*", ipRestrictionMiddleware);

    return createApp(app);
  };
}
