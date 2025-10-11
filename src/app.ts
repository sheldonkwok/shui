import { Hono } from "hono";
import { serve } from "@hono/node-server";

import plants from "./plants.ts";

const app = new Hono().route("/api/plants", plants);

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
