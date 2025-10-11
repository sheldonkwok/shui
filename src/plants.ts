import { Hono } from "hono";
import { ArkErrors } from "arktype";

import db from "./db.ts";
import { plants, plantInsertSchema, waterings } from "./schema.ts";

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

    await db.insert(plants).values({ name });
    return c.redirect("/");
  })
  .post("/:id/water", async (c) => {
    const plantId = parseInt(c.req.param("id"));

    if (isNaN(plantId)) {
      return c.text("Invalid plant ID", 400);
    }

    try {
      await db.insert(waterings).values({ plantId: plantId });
      return c.redirect("/");
    } catch (error) {
      return c.text("Invalid plant ID", 400);
    }
  });

export default app;
