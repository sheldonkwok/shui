import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { plants } from "./schema.js";
import { db } from "./db.js";
import { arktypeValidator } from "@hono/arktype-validator";
import { createInsertSchema } from "drizzle-arktype";

const plantSchema = createInsertSchema(plants);

const app = new Hono()
  .get("/", (c) => c.text("Hello, Hono!"))
  .get("/plants", async (c) => {
    const allPlants = await db.select().from(plants);
    return c.json(allPlants);
  })
  .post("/plants", arktypeValidator("json", plantSchema), async (c) => {
    const body = c.req.valid("json");
    const result = await db
      .insert(plants)
      .values({ name: body.name })
      .returning();

    return c.json(result[0]!);
  });

// Only start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  serve(app, () => {
    console.log("Server running on http://localhost:3000");
  });
}

export default app;
