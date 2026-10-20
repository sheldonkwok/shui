import { asc, desc, eq, isNull, max, or } from "drizzle-orm";
import { type DBExecutor, getDB } from "../db.ts";
import { choreStatus, irrigationSchedule } from "../garden-utils.ts";
import { choreCompletions, chores, irrigationRuns, plants } from "../schema.ts";

// Same window as the per-plant watering summary.
const IRRIGATION_WINDOW = 5;

export async function getIrrigationSummary(db: DBExecutor = getDB()) {
  const runs = await db
    .select({ runTime: irrigationRuns.runTime })
    .from(irrigationRuns)
    .orderBy(desc(irrigationRuns.runTime))
    .limit(IRRIGATION_WINDOW);
  return irrigationSchedule(runs.map((r) => r.runTime));
}

/** Chores for the whole garden or a still-active plant, with their status this season. */
export async function listChores(db: DBExecutor = getDB()) {
  const rows = await db
    .select({
      id: chores.id,
      title: chores.title,
      startMonth: chores.startMonth,
      endMonth: chores.endMonth,
      plantId: chores.plantId,
      plantName: plants.name,
      lastCompletedAt: max(choreCompletions.completedAt),
    })
    .from(chores)
    .leftJoin(plants, eq(chores.plantId, plants.id))
    .leftJoin(choreCompletions, eq(choreCompletions.choreId, chores.id))
    .where(or(isNull(chores.plantId), isNull(plants.deletedAt)))
    .groupBy(chores.id, plants.name)
    .orderBy(asc(chores.startMonth), asc(chores.id));

  return rows.map((row) => ({
    ...row,
    status: choreStatus(row.startMonth, row.endMonth, row.lastCompletedAt),
  }));
}
