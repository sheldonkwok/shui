import { Hono } from "hono";
import { arktypeValidator } from "@hono/arktype-validator";
import { eq } from "drizzle-orm";

import { db } from "./db.js";
import { waterings, wateringInsertSchema } from "./schema.js";

const app = new Hono()
  .get("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const ws = await db.select().from(waterings).where(eq(waterings.id, id));

    return c.json(ws[0]!);
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
