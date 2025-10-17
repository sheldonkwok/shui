import { Hono } from "hono";
import { ArkErrors } from "arktype";
import { eq, count, max } from "drizzle-orm";

import db from "./db.ts";
import { plants, plantInsertSchema, waterings } from "./schema.ts";

const app = new Hono()
  .get("/", async (c) => {
    const data = await db
      .select({
        id: plants.id,
        name: plants.name,
        wateringCount: count(waterings.id),
        lastWatered: max(waterings.wateringTime),
      })
      .from(plants)
      .leftJoin(waterings, eq(plants.id, waterings.plantId))
      .groupBy(plants.id);

    return c.json(data);
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
