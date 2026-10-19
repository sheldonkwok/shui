import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { getGarden } from "../actions/garden.ts";
import { getDB } from "../db.ts";
import { choreCompletions, irrigationRuns, plants } from "../schema.ts";
import { cleanupTestDB, seedPlant } from "../test-utils.ts";
import { app } from "./index.ts";

const DAY = 24 * 60 * 60 * 1000;
const thisMonth = new Date().getMonth() + 1;
// A one-month window that never contains the current month.
const otherMonth = (thisMonth % 12) + 1;

function post(path: string, body?: unknown) {
  return app.request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function addChore(body: Record<string, unknown>) {
  const res = await post("/api/garden/chores", body);
  expect(res.status).toBe(201);
  return ((await res.json()) as { id: number }).id;
}

describe("POST /api/garden/irrigate", () => {
  beforeEach(async () => {
    await cleanupTestDB();
  });

  it("logs a run and reports it as the last run", async () => {
    const res = await post("/api/garden/irrigate");

    expect(res.status).toBe(201);
    const { irrigation } = await getGarden();
    expect(irrigation.lastRun).toBeInstanceOf(Date);
    expect(irrigation.avgIntervalDays).toBeNull();
  });

  it("schedules the next run from the average gap between runs", async () => {
    const now = Date.now();
    await getDB()
      .insert(irrigationRuns)
      .values([2, 5, 8].map((d) => ({ runTime: new Date(now - d * DAY) })));

    const { irrigation } = await getGarden();

    expect(irrigation.avgIntervalDays).toBe(3);
    expect(irrigation.daysUntilNextRun).toBeCloseTo(1, 0);
  });
});

describe("garden chores", () => {
  beforeEach(async () => {
    await cleanupTestDB();
  });

  it("creates a whole-garden chore that is due in its season", async () => {
    await addChore({ title: "Mulch beds", startMonth: thisMonth, endMonth: thisMonth });

    const { chores } = await getGarden();

    expect(chores).toEqual([
      expect.objectContaining({ title: "Mulch beds", plantId: null, plantName: null, status: "due" }),
    ]);
  });

  it("ties a chore to a plant", async () => {
    const plantId = await seedPlant("Roses", "outdoor");
    await addChore({ title: "Prune", startMonth: thisMonth, endMonth: thisMonth, plantId });

    const { chores } = await getGarden();

    expect(chores[0]).toMatchObject({ plantId, plantName: "Roses" });
  });

  it("marks out-of-season chores upcoming and sorts due ones first", async () => {
    await addChore({ title: "Later", startMonth: otherMonth, endMonth: otherMonth });
    await addChore({ title: "Now", startMonth: thisMonth, endMonth: thisMonth });

    const { chores } = await getGarden();

    expect(chores.map((c) => [c.title, c.status])).toEqual([
      ["Now", "due"],
      ["Later", "upcoming"],
    ]);
  });

  it("completes a chore and undoes the completion", async () => {
    const id = await addChore({ title: "Mulch beds", startMonth: thisMonth, endMonth: thisMonth });

    expect((await post(`/api/garden/chores/${id}/complete`)).status).toBe(201);
    expect((await getGarden()).chores[0]!.status).toBe("done");

    const undo = await app.request(`/api/garden/chores/${id}/complete`, { method: "DELETE" });
    expect(undo.status).toBe(200);
    expect((await getGarden()).chores[0]!.status).toBe("due");
  });

  it("treats a completion from last year as not done this season", async () => {
    const id = await addChore({ title: "Mulch beds", startMonth: thisMonth, endMonth: thisMonth });
    await getDB()
      .insert(choreCompletions)
      .values({ choreId: id, completedAt: new Date(Date.now() - 365 * DAY) });

    expect((await getGarden()).chores[0]!.status).toBe("due");
  });

  it("deletes a chore along with its completions", async () => {
    const id = await addChore({ title: "Mulch beds", startMonth: thisMonth, endMonth: thisMonth });
    await post(`/api/garden/chores/${id}/complete`);

    const res = await app.request(`/api/garden/chores/${id}`, { method: "DELETE" });

    expect(res.status).toBe(200);
    expect((await getGarden()).chores).toEqual([]);
    expect(await getDB().select().from(choreCompletions)).toEqual([]);
  });

  it("hides chores for deleted plants", async () => {
    const plantId = await seedPlant("Roses", "outdoor");
    await addChore({ title: "Prune", startMonth: thisMonth, endMonth: thisMonth, plantId });
    await getDB().update(plants).set({ deletedAt: new Date() }).where(eq(plants.id, plantId));

    expect((await getGarden()).chores).toEqual([]);
  });

  it("rejects an invalid month", async () => {
    const res = await post("/api/garden/chores", { title: "Mulch", startMonth: 0, endMonth: 13 });
    expect(res.status).toBe(400);
  });

  it("returns 404 for a chore on a missing plant", async () => {
    const res = await post("/api/garden/chores", { title: "Prune", startMonth: 1, endMonth: 2, plantId: 99 });
    expect(res.status).toBe(404);
  });

  it("returns 404 when completing a missing chore", async () => {
    expect((await post("/api/garden/chores/99/complete")).status).toBe(404);
  });
});
