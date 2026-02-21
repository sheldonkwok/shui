import { arktypeValidator } from "@hono/arktype-validator";
import { type } from "arktype";
import { eq } from "drizzle-orm";
import { Hono } from "hono";

import { getDB } from "../db.ts";
import { plants } from "../schema.ts";

const renameSchema = type({ name: "string" });

export const plantsRouter = new Hono().patch("/:id", arktypeValidator("json", renameSchema), async (c) => {
  const plantId = Number(c.req.param("id"));
  if (!Number.isInteger(plantId) || plantId <= 0) {
    return c.json({ error: "Invalid plant ID" }, 400);
  }

  const { name } = c.req.valid("json");
  await getDB().update(plants).set({ name }).where(eq(plants.id, plantId));

  return c.json({ ok: true });
});
