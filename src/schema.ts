import { createInsertSchema } from "drizzle-arktype";
import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  pgMaterializedView,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

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

export const plantDelays = pgTable(
  "plant_delays",
  {
    id: serial("id").primaryKey(),
    plantId: integer("plant_id")
      .notNull()
      .references(() => plants.id),
    dateAdded: timestamp("date_added", { withTimezone: true }).defaultNow().notNull(),
    numDays: integer("num_days").notNull(),
  },
  (table) => [unique().on(table.plantId)],
);

export const wateringSummary = pgMaterializedView("watering_summary", {
  plantId: integer("plant_id"),
  wateringCount: integer("watering_count"),
  lastWatered: timestamp("last_watered", { withTimezone: true }),
  avgIntervalDays: real("avg_interval_days"),
  lastFertilized: timestamp("last_fertilized", { withTimezone: true }),
}).as(sql`
  SELECT
    plant_id,
    COUNT(*)::integer AS watering_count,
    MAX(watering_time) AS last_watered,
    CASE
      WHEN COUNT(*) >= 2 THEN ROUND(
        EXTRACT(EPOCH FROM (MAX(watering_time) - MIN(watering_time)))::numeric / (COUNT(*) - 1) / 86400,
        1
      )::real
      ELSE NULL
    END AS avg_interval_days,
    MAX(watering_time) FILTER (WHERE fertilized) AS last_fertilized
  FROM waterings w1
  WHERE
    (SELECT COUNT(*) FROM waterings w2
     WHERE w2.plant_id = w1.plant_id AND w2.watering_time > w1.watering_time) < 5
  GROUP BY plant_id
`);
