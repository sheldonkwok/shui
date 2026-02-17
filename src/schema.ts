import { createInsertSchema } from "drizzle-arktype";
import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const plants = pgTable("plants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

export const plantInsertSchema = createInsertSchema(plants);

export const waterings = pgTable("waterings", {
  id: serial("id").primaryKey(),
  plantId: integer("plant_id")
    .notNull()
    .references(() => plants.id),
  wateringTime: timestamp("watering_time", { withTimezone: true }).defaultNow().notNull(),
  fertilized: boolean("fertilized").default(false),
});

export const wateringInsertSchema = createInsertSchema(waterings);
