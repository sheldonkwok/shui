import { Hono } from "hono";
import { serve } from "@hono/node-server";

import auth from "./auth.ts";

import plants from "./plants.ts";
import waterings from "./waterings.ts";

const app = new Hono()
  .use("/*", auth.middleware)
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
