import { arktypeValidator } from "@hono/arktype-validator";
import { type } from "arktype";
import { eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { classifyPlant } from "../actions/plants.ts";
import {
  deleteWatering,
  getWateringHistory,
  refreshWateringSummary,
  updateWatering,
} from "../actions/plants-helper.ts";
import { getDB } from "../db.ts";
import { plantDelays, plants, waterings } from "../schema.ts";

const renameSchema = type({ name: "string" });
const addPlantSchema = type({ name: "string" });
const wateringSchema = type({ fertilized: "boolean" });
const delaySchema = type({ numDays: "number.integer > 0" });
const classifySchema = type({ species: "string" });
const editWateringSchema = type({ "fertilized?": "boolean", "repot?": "boolean" });

// 6 weeks of daily history, shown in the plant action dialog.
const WATERING_HISTORY_DAYS = 42;

function isValidId(id: number) {
  return Number.isInteger(id) && id > 0;
}

export const plantsRouter = new Hono()
  .post("/", arktypeValidator("json", addPlantSchema), async (c) => {
    const { name } = c.req.valid("json");
    const [plant] = await getDB().insert(plants).values({ name }).returning();
    return c.json({ ok: true, id: plant!.id }, 201);
  })
  .post("/:id/water", arktypeValidator("json", wateringSchema), async (c) => {
    const plantId = Number(c.req.param("id"));
    if (!Number.isInteger(plantId) || plantId <= 0) {
      return c.json({ error: "Invalid plant ID" }, 400);
    }
    const { fertilized } = c.req.valid("json");
    await getDB().insert(waterings).values({ plantId, fertilized });
    // Watering resets the schedule, so any pending delay no longer applies.
    await getDB().delete(plantDelays).where(eq(plantDelays.plantId, plantId));
    await refreshWateringSummary();
    return c.json({ ok: true }, 201);
  })
  .get("/:id/waterings", async (c) => {
    const plantId = Number(c.req.param("id"));
    if (!Number.isInteger(plantId) || plantId <= 0) {
      return c.json({ error: "Invalid plant ID" }, 400);
    }
    const history = await getWateringHistory(plantId, WATERING_HISTORY_DAYS);
    return c.json({
      waterings: history.map((w) => ({
        id: w.id,
        wateringTime: w.wateringTime.toISOString(),
        fertilized: w.fertilized ?? false,
        repot: w.repot ?? false,
      })),
    });
  })
  .patch("/:id/waterings/:wateringId", arktypeValidator("json", editWateringSchema), async (c) => {
    const plantId = Number(c.req.param("id"));
    const wateringId = Number(c.req.param("wateringId"));
    if (!isValidId(plantId) || !isValidId(wateringId)) {
      return c.json({ error: "Invalid ID" }, 400);
    }
    const { fertilized, repot } = c.req.valid("json");
    if (fertilized === undefined && repot === undefined) {
      return c.json({ error: "Nothing to update" }, 400);
    }
    const updated = await updateWatering(plantId, wateringId, { fertilized, repot });
    if (!updated) return c.json({ error: "Watering not found" }, 404);
    await refreshWateringSummary();
    return c.json({ ok: true });
  })
  .delete("/:id/waterings/:wateringId", async (c) => {
    const plantId = Number(c.req.param("id"));
    const wateringId = Number(c.req.param("wateringId"));
    if (!isValidId(plantId) || !isValidId(wateringId)) {
      return c.json({ error: "Invalid ID" }, 400);
    }
    const deleted = await deleteWatering(plantId, wateringId);
    if (!deleted) return c.json({ error: "Watering not found" }, 404);
    await refreshWateringSummary();
    return c.json({ ok: true });
  })
  .post("/:id/delay", arktypeValidator("json", delaySchema), async (c) => {
    const plantId = Number(c.req.param("id"));
    if (!Number.isInteger(plantId) || plantId <= 0) {
      return c.json({ error: "Invalid plant ID" }, 400);
    }
    const { numDays } = c.req.valid("json");
    // A new delay extends an active one by numDays; an expired one restarts from now.
    // Both SET expressions read the existing row's values.
    const active = sql`EXTRACT(EPOCH FROM (NOW() - ${plantDelays.dateAdded})) / 86400 < ${plantDelays.numDays}`;
    await getDB()
      .insert(plantDelays)
      .values({ plantId, numDays })
      .onConflictDoUpdate({
        target: plantDelays.plantId,
        set: {
          numDays: sql`CASE WHEN ${active} THEN ${plantDelays.numDays} + ${numDays} ELSE ${numDays} END`,
          dateAdded: sql`CASE WHEN ${active} THEN ${plantDelays.dateAdded} ELSE NOW() END`,
        },
      });
    return c.json({ ok: true }, 201);
  })
  .post("/:id/classify", arktypeValidator("json", classifySchema), async (c) => {
    const plantId = Number(c.req.param("id"));
    if (!Number.isInteger(plantId) || plantId <= 0) {
      return c.json({ error: "Invalid plant ID" }, 400);
    }
    const { species } = c.req.valid("json");
    const result = await classifyPlant(plantId, species);
    if ("error" in result) return c.json(result, 422);
    return c.json(result);
  })
  .patch("/:id", arktypeValidator("json", renameSchema), async (c) => {
    const plantId = Number(c.req.param("id"));
    if (!Number.isInteger(plantId) || plantId <= 0) {
      return c.json({ error: "Invalid plant ID" }, 400);
    }

    const { name } = c.req.valid("json");
    await getDB().update(plants).set({ name }).where(eq(plants.id, plantId));

    return c.json({ ok: true });
  })
  .delete("/:id", async (c) => {
    const plantId = Number(c.req.param("id"));
    if (!Number.isInteger(plantId) || plantId <= 0) {
      return c.json({ error: "Invalid plant ID" }, 400);
    }
    await getDB().delete(waterings).where(eq(waterings.plantId, plantId));
    await getDB().delete(plantDelays).where(eq(plantDelays.plantId, plantId));
    await getDB().delete(plants).where(eq(plants.id, plantId));
    return c.json({ ok: true });
  });
