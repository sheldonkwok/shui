import { arktypeValidator } from "@hono/arktype-validator";
import { type } from "arktype";
import { and, desc, eq, isNull } from "drizzle-orm";
import { Hono } from "hono";
import { getDB } from "../db.ts";
import { choreCompletions, chores, irrigationRuns, plants } from "../schema.ts";

const month = "1 <= number.integer <= 12";
const addChoreSchema = type({
  title: "string > 0",
  startMonth: month,
  endMonth: month,
  "plantId?": "number.integer > 0 | null",
});

const positiveId = type("string.integer.parse").to("number > 0");
const choreParamSchema = type({ id: positiveId });

const choreIdValidator = () =>
  arktypeValidator("param", choreParamSchema, (result, c) => {
    if (!result.success) return c.json({ error: "Invalid chore ID" }, 400);
    return undefined;
  });

export const gardenRouter = new Hono()
  .post("/irrigate", async (c) => {
    await getDB().insert(irrigationRuns).values({});
    return c.json({ ok: true }, 201);
  })
  .post("/chores", arktypeValidator("json", addChoreSchema), async (c) => {
    const { title, startMonth, endMonth, plantId } = c.req.valid("json");
    if (plantId) {
      const [plant] = await getDB()
        .select({ id: plants.id })
        .from(plants)
        .where(and(eq(plants.id, plantId), isNull(plants.deletedAt)));
      if (!plant) return c.json({ error: "Plant not found" }, 404);
    }
    const [chore] = await getDB()
      .insert(chores)
      .values({ title: title.trim(), startMonth, endMonth, plantId: plantId ?? null })
      .returning();
    return c.json({ ok: true, id: chore!.id }, 201);
  })
  .delete("/chores/:id", choreIdValidator(), async (c) => {
    const { id } = c.req.valid("param");
    const deleted = await getDB().delete(chores).where(eq(chores.id, id)).returning();
    if (deleted.length === 0) return c.json({ error: "Chore not found" }, 404);
    return c.json({ ok: true });
  })
  .post("/chores/:id/complete", choreIdValidator(), async (c) => {
    const { id: choreId } = c.req.valid("param");
    const [chore] = await getDB().select({ id: chores.id }).from(chores).where(eq(chores.id, choreId));
    if (!chore) return c.json({ error: "Chore not found" }, 404);
    await getDB().insert(choreCompletions).values({ choreId });
    return c.json({ ok: true }, 201);
  })
  // Undoes the latest completion, for a chore that was ticked off by mistake.
  .delete("/chores/:id/complete", choreIdValidator(), async (c) => {
    const { id: choreId } = c.req.valid("param");
    const [latest] = await getDB()
      .select({ id: choreCompletions.id })
      .from(choreCompletions)
      .where(eq(choreCompletions.choreId, choreId))
      .orderBy(desc(choreCompletions.completedAt))
      .limit(1);
    if (!latest) return c.json({ error: "Chore not completed" }, 404);
    await getDB().delete(choreCompletions).where(eq(choreCompletions.id, latest.id));
    return c.json({ ok: true });
  });
