import { Hono } from "hono";

import db from "./db.ts";
import { plants, plantInsertSchema } from "./schema.ts";
import { arktypeValidator } from "@hono/arktype-validator";

const app = new Hono()
  .get("/", async (c) => {
    const allPlants = await db.select().from(plants);
    return c.json(allPlants);
  })
  .post("/", arktypeValidator("json", plantInsertSchema), async (c) => {
    const body = c.req.valid("json");
    const result = await db
      .insert(plants)
      .values({ name: body.name })
      .returning();

    return c.json(result[0]!);
  });

export default app;
