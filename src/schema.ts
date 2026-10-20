import { createInsertSchema } from "drizzle-arktype";
import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  pgEnum,
  pgMaterializedView,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const plantLocation = pgEnum("plant_location", ["indoor", "outdoor"]);

export const plants = pgTable("plants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  species: text("species"),
  // Outdoor plants are watered together by irrigation, so they have no per-plant waterings.
  location: plantLocation("location").default("indoor").notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const plantInsertSchema = createInsertSchema(plants);

export const waterings = pgTable("waterings", {
  id: serial("id").primaryKey(),
  plantId: integer("plant_id")
    .notNull()
    .references(() => plants.id),
  wateringTime: timestamp("watering_time", { withTimezone: true }).defaultNow().notNull(),
  fertilized: boolean("fertilized").default(false),
  repot: boolean("repot").default(false),
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

/** One hand-started run of the outdoor irrigation, which waters every outdoor plant at once. */
export const irrigationRuns = pgTable("irrigation_runs", {
  id: serial("id").primaryKey(),
  runTime: timestamp("run_time", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * A yearly outdoor task, due each year from the start of `startMonth` to the end of
 * `endMonth` (1–12). The window may wrap the new year (e.g. Nov–Feb). A null plantId
 * means the chore is for the whole garden.
 */
export const chores = pgTable("chores", {
  id: serial("id").primaryKey(),
  plantId: integer("plant_id").references(() => plants.id),
  title: text("title").notNull(),
  startMonth: integer("start_month").notNull(),
  endMonth: integer("end_month").notNull(),
});

export const choreCompletions = pgTable("chore_completions", {
  id: serial("id").primaryKey(),
  choreId: integer("chore_id")
    .notNull()
    .references(() => chores.id, { onDelete: "cascade" }),
  completedAt: timestamp("completed_at", { withTimezone: true }).defaultNow().notNull(),
});

export const wateringSummary = pgMaterializedView("watering_summary", {
  plantId: integer("plant_id"),
  wateringCount: integer("watering_count"),
  lastWatered: timestamp("last_watered", { withTimezone: true }),
  avgIntervalDays: real("avg_interval_days"),
  lastFertilized: timestamp("last_fertilized", { withTimezone: true }),
  lastRepotted: timestamp("last_repotted", { withTimezone: true }),
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
    MAX(watering_time) FILTER (WHERE fertilized) AS last_fertilized,
    -- Repots are yearly and waterings weekly, so a FILTER over the 5-row window
    -- below would almost always be NULL. This column looks at the whole history.
    (SELECT MAX(w3.watering_time) FROM waterings w3
     WHERE w3.plant_id = w1.plant_id AND w3.repot) AS last_repotted
  FROM waterings w1
  WHERE
    (SELECT COUNT(*) FROM waterings w2
     WHERE w2.plant_id = w1.plant_id AND w2.watering_time > w1.watering_time) < 5
  GROUP BY plant_id
`);
