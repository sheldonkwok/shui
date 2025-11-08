import type { Hono } from "hono";
import { ipRestrictionMiddleware } from "./auth-ip.ts";

// This is a higher-order function that wraps the createApp function
export default function enhance(createApp: (app: Hono) => Hono) {
  return (app: Hono) => {
    // Apply IP restriction middleware to all routes
    app.use("*", ipRestrictionMiddleware);

    // Apply auth routes
    // app.route("/", auth.routes);

    // Apply session middleware to protected routes
    // app.use("*", auth.middleware);

    // Call the original createApp function
    return createApp(app);
  };
}
