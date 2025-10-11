import { Hono } from "hono";
import { ArkErrors } from "arktype";

import db from "./db.ts";
import { plants, plantInsertSchema } from "./schema.ts";

const app = new Hono()
  .get("/", async (c) => {
    const allPlants = await db.select().from(plants);
    return c.json(allPlants);
  })
  .post("/", async (c) => {
    // Handle form data
    const formData = await c.req.formData();
    const formName = formData.get("name") as string;

    const validated = plantInsertSchema({ name: formName });
    if (validated instanceof ArkErrors) throw validated;

    const name = validated.name;

    await db.insert(plants).values({ name }).returning();

    return c.redirect("/");
  });

export default app;
