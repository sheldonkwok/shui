import { arktypeValidator } from "@hono/arktype-validator";
import { type } from "arktype";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { refreshWateringSummary } from "../actions/plants-helper.ts";
import { getDB } from "../db.ts";
import { plants, waterings } from "../schema.ts";

const renameSchema = type({ name: "string" });
const addPlantSchema = type({ name: "string" });
const wateringSchema = type({ fertilized: "boolean" });

export const plantsRouter = new Hono()
  .post("/", arktypeValidator("json", addPlantSchema), async (c) => {
    const { name } = c.req.valid("json");
    await getDB().insert(plants).values({ name });
    return c.json({ ok: true }, 201);
  })
  .post("/:id/water", arktypeValidator("json", wateringSchema), async (c) => {
    const plantId = Number(c.req.param("id"));
    if (!Number.isInteger(plantId) || plantId <= 0) {
      return c.json({ error: "Invalid plant ID" }, 400);
    }
    const { fertilized } = c.req.valid("json");
    await getDB().insert(waterings).values({ plantId, fertilized });
    await refreshWateringSummary();
    return c.json({ ok: true }, 201);
  })
  .patch("/:id", arktypeValidator("json", renameSchema), async (c) => {
    const plantId = Number(c.req.param("id"));
    if (!Number.isInteger(plantId) || plantId <= 0) {
      return c.json({ error: "Invalid plant ID" }, 400);
    }

    const { name } = c.req.valid("json");
    await getDB().update(plants).set({ name }).where(eq(plants.id, plantId));

    return c.json({ ok: true });
  });
