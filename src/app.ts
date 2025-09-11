import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";

import auth from "./auth.ts";

import plants from "./plants.ts";
import waterings from "./waterings.ts";

const app = new Hono()
  .route("/api", auth.routes)
  .use("/api/*", auth.middleware)
  .use("/*", serveStatic({ root: "./dist" }))
  .route("/api/plants", plants)
  .route("/api/waterings", waterings);

// Serve with Node.js when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = 3000;
  console.log(`Server is running on port ${port}`);
  serve({
    fetch: app.fetch,
    port: Number(port),
  });
}

export default app;
