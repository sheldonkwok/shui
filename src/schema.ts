import { createInsertSchema } from "drizzle-arktype";
import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const plants = sqliteTable("plants", {
  id: integer("id").primaryKey(),
  name: text("name", { length: 255 }).notNull(),
});

export const plantInsertSchema = createInsertSchema(plants);

export const waterings = sqliteTable("waterings", {
  id: integer("id").primaryKey(),
  plantId: integer("plant_id")
    .notNull()
    .references(() => plants.id),
  wateringTime: integer("watering_time", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  fertilized: integer("fertilized", { mode: "boolean" }).default(0),
});

export const wateringInsertSchema = createInsertSchema(waterings);
