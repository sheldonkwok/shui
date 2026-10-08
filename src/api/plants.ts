import { arktypeValidator } from "@hono/arktype-validator";
import { type } from "arktype";
import { and, eq, isNull, sql } from "drizzle-orm";
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

const positiveId = type("string.integer.parse").to("number > 0");
const plantParamSchema = type({ id: positiveId });
const wateringParamSchema = type({ id: positiveId, wateringId: positiveId });

// Keeps the 400 error bodies the client already receives for a bad route ID.
const plantIdValidator = () =>
  arktypeValidator("param", plantParamSchema, (result, c) => {
    if (!result.success) return c.json({ error: "Invalid plant ID" }, 400);
    return undefined;
  });
const wateringIdValidator = () =>
  arktypeValidator("param", wateringParamSchema, (result, c) => {
    if (!result.success) return c.json({ error: "Invalid ID" }, 400);
    return undefined;
  });

export const plantsRouter = new Hono()
  .post("/", arktypeValidator("json", addPlantSchema), async (c) => {
    const { name } = c.req.valid("json");
    const [plant] = await getDB().insert(plants).values({ name }).returning();
    return c.json({ ok: true, id: plant!.id }, 201);
  })
  .post("/:id/water", plantIdValidator(), arktypeValidator("json", wateringSchema), async (c) => {
    const { id: plantId } = c.req.valid("param");
    const { fertilized } = c.req.valid("json");
    const found = await getDB().transaction(async (tx) => {
      const [plant] = await tx
        .select({ id: plants.id })
        .from(plants)
        .where(and(eq(plants.id, plantId), isNull(plants.deletedAt)));
      if (!plant) return false;
      await tx.insert(waterings).values({ plantId, fertilized });
      // Watering resets the schedule, so any pending delay no longer applies.
      await tx.delete(plantDelays).where(eq(plantDelays.plantId, plantId));
      await refreshWateringSummary(tx);
      return true;
    });
    if (!found) return c.json({ error: "Plant not found" }, 404);
    return c.json({ ok: true }, 201);
  })
  .get("/:id/waterings", plantIdValidator(), async (c) => {
    const { id: plantId } = c.req.valid("param");
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
  .patch(
    "/:id/waterings/:wateringId",
    wateringIdValidator(),
    arktypeValidator("json", editWateringSchema),
    async (c) => {
      const { id: plantId, wateringId } = c.req.valid("param");
      const { fertilized, repot } = c.req.valid("json");
      if (fertilized === undefined && repot === undefined) {
        return c.json({ error: "Nothing to update" }, 400);
      }
      const updated = await getDB().transaction(async (tx) => {
        const ok = await updateWatering(plantId, wateringId, { fertilized, repot }, tx);
        if (ok) await refreshWateringSummary(tx);
        return ok;
      });
      if (!updated) return c.json({ error: "Watering not found" }, 404);
      return c.json({ ok: true });
    },
  )
  .delete("/:id/waterings/:wateringId", wateringIdValidator(), async (c) => {
    const { id: plantId, wateringId } = c.req.valid("param");
    const deleted = await getDB().transaction(async (tx) => {
      const ok = await deleteWatering(plantId, wateringId, tx);
      if (ok) await refreshWateringSummary(tx);
      return ok;
    });
    if (!deleted) return c.json({ error: "Watering not found" }, 404);
    return c.json({ ok: true });
  })
  .post("/:id/delay", plantIdValidator(), arktypeValidator("json", delaySchema), async (c) => {
    const { id: plantId } = c.req.valid("param");
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
  .post("/:id/classify", plantIdValidator(), arktypeValidator("json", classifySchema), async (c) => {
    const { id: plantId } = c.req.valid("param");
    const { species } = c.req.valid("json");
    const result = await classifyPlant(plantId, species);
    if ("error" in result) return c.json(result, 422);
    return c.json(result);
  })
  .patch("/:id", plantIdValidator(), arktypeValidator("json", renameSchema), async (c) => {
    const { id: plantId } = c.req.valid("param");

    const { name } = c.req.valid("json");
    await getDB().update(plants).set({ name }).where(eq(plants.id, plantId));

    return c.json({ ok: true });
  })
  .delete("/:id", plantIdValidator(), async (c) => {
    const { id: plantId } = c.req.valid("param");
    // Soft delete: keep the plant row and its waterings so history survives.
    const deleted = await getDB()
      .update(plants)
      .set({ deletedAt: sql`NOW()` })
      .where(and(eq(plants.id, plantId), isNull(plants.deletedAt)))
      .returning();
    if (deleted.length === 0) return c.json({ error: "Plant not found" }, 404);
    return c.json({ ok: true });
  });
