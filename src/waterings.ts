import { Hono } from "hono";
import { arktypeValidator } from "@hono/arktype-validator";

import { db } from "./db.js";
import { waterings, wateringInsertSchema } from "./schema.js";

const app = new Hono()
  .get("/", async (c) => {
    const allWaterings = await db.select().from(waterings);
    return c.json(allWaterings);
  })
  .post("/", arktypeValidator("json", wateringInsertSchema), async (c) => {
    const body = c.req.valid("json");
    const result = await db
      .insert(waterings)
      .values({ plantId: body.plantId })
      .returning();

    return c.json(result[0]!);
  });

export default app;
