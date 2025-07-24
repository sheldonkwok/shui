import { Hono } from "hono";
import { serve } from "@hono/node-server";

import plants from "./plants.js";
import waterings from "./waterings.js";

const app = new Hono()
  .get("/", (c) => c.text("Hello, Hono!"))
  .route("/plants", plants)
  .route("/waterings", waterings);

// Only start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  serve(app, () => {
    console.log("Server running on http://localhost:3000");
  });
}

export default app;
