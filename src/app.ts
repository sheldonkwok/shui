import { Hono } from "hono";
import { serve } from "@hono/node-server";

import auth from "./auth.ts";

import plants from "./plants.ts";
import waterings from "./waterings.ts";

const app = new Hono()
  .route("/", auth.routes)
  .use(auth.middleware)
  .get("/", (c) => {
    return c.text(`Hello, ${c.var.session.user.firstName}!`);
  })
  .route("/plants", plants)
  .route("/waterings", waterings);

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
