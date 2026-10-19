"use server";

import type { ChoreWithStatus, IrrigationSummary } from "../types.ts";
import { getIrrigationSummary, listChores } from "./garden-helper.ts";

const STATUS_ORDER = { due: 0, done: 1, upcoming: 2 } as const;

export async function getGarden(): Promise<{ irrigation: IrrigationSummary; chores: ChoreWithStatus[] }> {
  const [irrigation, chores] = await Promise.all([getIrrigationSummary(), listChores()]);
  // Due chores first, then this season's finished ones, then the rest of the year.
  chores.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  return { irrigation, chores };
}
