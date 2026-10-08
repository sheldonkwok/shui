import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getPlants } from "../actions/plants.ts";
import { getDB } from "../db.ts";
import { plants, waterings } from "../schema.ts";
import { cleanupTestDB, seedDelay, seedPlant, seedWatering } from "../test-utils.ts";
import { app } from "./index.ts";

const DAY = 24 * 60 * 60 * 1000;

describe("POST /api/plants", () => {
  beforeEach(async () => {
    await cleanupTestDB();
  });

  it("should create a plant successfully", async () => {
    const res = await app.request("/api/plants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Monstera" }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true });
    expect(typeof body.id).toBe("number");
  });

  it("should return 400 for an invalid body", async () => {
    const res = await app.request("/api/plants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: 123 }),
    });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/plants/:id/water", () => {
  beforeEach(async () => {
    await cleanupTestDB();
  });

  it("should record a watering successfully", async () => {
    const plantId = await seedPlant("Fern");

    const res = await app.request(`/api/plants/${plantId}/water`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fertilized: false }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });

  it("should record a watering with fertilizer", async () => {
    const plantId = await seedPlant("Cactus");

    const res = await app.request(`/api/plants/${plantId}/water`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fertilized: true }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });

  it("should return 400 for a non-integer plant ID", async () => {
    const res = await app.request("/api/plants/abc/water", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fertilized: false }),
    });

    expect(res.status).toBe(400);
  });

  it("should return 400 for an invalid body", async () => {
    const plantId = await seedPlant("Rose");

    const res = await app.request(`/api/plants/${plantId}/water`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fertilized: "yes" }),
    });

    expect(res.status).toBe(400);
  });

  it("should ignore a repot flag when logging a new watering", async () => {
    const plantId = await seedPlant("Fern");

    const res = await app.request(`/api/plants/${plantId}/water`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fertilized: false, repot: true }),
    });

    expect(res.status).toBe(201);
    const list = await app.request(`/api/plants/${plantId}/waterings`);
    const body = await list.json();
    expect(body.waterings).toEqual([expect.objectContaining({ repot: false })]);
  });

  it("should return 404 when watering a plant that does not exist", async () => {
    const res = await app.request("/api/plants/999/water", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fertilized: false }),
    });

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Plant not found" });
  });

  it("should return 404 and insert nothing when watering a soft-deleted plant", async () => {
    const plantId = await seedPlant("Fern");
    await getDB().update(plants).set({ deletedAt: new Date() }).where(eq(plants.id, plantId));

    const res = await app.request(`/api/plants/${plantId}/water`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fertilized: false }),
    });

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Plant not found" });
    const rows = await getDB().select().from(waterings).where(eq(waterings.plantId, plantId));
    expect(rows).toHaveLength(0);
  });
});

describe("GET /api/plants/:id/waterings", () => {
  beforeEach(async () => {
    await cleanupTestDB();
  });

  it("should return waterings within the last 42 days", async () => {
    const plantId = await seedPlant("Fern");
    const now = new Date();
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    await seedWatering(plantId, now, false);
    await seedWatering(plantId, tenDaysAgo, true);

    const res = await app.request(`/api/plants/${plantId}/waterings`);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.waterings).toHaveLength(2);
    expect(body.waterings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fertilized: false }),
        expect.objectContaining({ fertilized: true }),
      ]),
    );
  });

  it("should exclude waterings older than 42 days", async () => {
    const plantId = await seedPlant("Cactus");
    const now = new Date();
    const tooOld = new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000);
    await seedWatering(plantId, now, false);
    await seedWatering(plantId, tooOld, false);

    const res = await app.request(`/api/plants/${plantId}/waterings`);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.waterings).toHaveLength(1);
  });

  it("should return an empty list for a plant with no waterings", async () => {
    const plantId = await seedPlant("Never Watered");

    const res = await app.request(`/api/plants/${plantId}/waterings`);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.waterings).toEqual([]);
  });

  it("should return 400 for a non-integer plant ID", async () => {
    const res = await app.request("/api/plants/abc/waterings");

    expect(res.status).toBe(400);
  });

  it("should include the repot flag", async () => {
    const plantId = await seedPlant("Fern");
    await seedWatering(plantId, new Date(), false, true);

    const res = await app.request(`/api/plants/${plantId}/waterings`);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.waterings).toEqual([expect.objectContaining({ fertilized: false, repot: true })]);
  });
});

describe("PATCH /api/plants/:id/waterings/:wateringId", () => {
  beforeEach(async () => {
    await cleanupTestDB();
  });

  it("should toggle fertilized on a watering", async () => {
    const plantId = await seedPlant("Fern");
    const wateringId = await seedWatering(plantId, new Date(), false);

    const res = await app.request(`/api/plants/${plantId}/waterings/${wateringId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fertilized: true }),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    const list = await app.request(`/api/plants/${plantId}/waterings`);
    const body = await list.json();
    expect(body.waterings).toEqual([expect.objectContaining({ id: wateringId, fertilized: true })]);
  });

  it("should return 404 for a watering belonging to another plant", async () => {
    const plantId = await seedPlant("Fern");
    const otherPlantId = await seedPlant("Cactus");
    const wateringId = await seedWatering(otherPlantId, new Date(), false);

    const res = await app.request(`/api/plants/${plantId}/waterings/${wateringId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fertilized: true }),
    });

    expect(res.status).toBe(404);
  });

  it("should return 400 for a non-integer watering ID", async () => {
    const plantId = await seedPlant("Fern");

    const res = await app.request(`/api/plants/${plantId}/waterings/abc`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fertilized: true }),
    });

    expect(res.status).toBe(400);
  });

  it("should return 400 for an invalid body", async () => {
    const plantId = await seedPlant("Fern");
    const wateringId = await seedWatering(plantId, new Date(), false);

    const res = await app.request(`/api/plants/${plantId}/waterings/${wateringId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fertilized: "yes" }),
    });

    expect(res.status).toBe(400);
  });

  it("should toggle repot on a watering without touching fertilized", async () => {
    const plantId = await seedPlant("Fern");
    const wateringId = await seedWatering(plantId, new Date(), true);

    const res = await app.request(`/api/plants/${plantId}/waterings/${wateringId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repot: true }),
    });

    expect(res.status).toBe(200);

    const list = await app.request(`/api/plants/${plantId}/waterings`);
    const body = await list.json();
    expect(body.waterings).toEqual([
      expect.objectContaining({ id: wateringId, fertilized: true, repot: true }),
    ]);
  });

  it("should set both flags at once", async () => {
    const plantId = await seedPlant("Fern");
    const wateringId = await seedWatering(plantId, new Date(), false);

    const res = await app.request(`/api/plants/${plantId}/waterings/${wateringId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fertilized: true, repot: true }),
    });

    expect(res.status).toBe(200);

    const list = await app.request(`/api/plants/${plantId}/waterings`);
    const body = await list.json();
    expect(body.waterings).toEqual([
      expect.objectContaining({ id: wateringId, fertilized: true, repot: true }),
    ]);
  });

  it("should return 400 for a non-boolean repot", async () => {
    const plantId = await seedPlant("Fern");
    const wateringId = await seedWatering(plantId, new Date(), false);

    const res = await app.request(`/api/plants/${plantId}/waterings/${wateringId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repot: "yes" }),
    });

    expect(res.status).toBe(400);
  });

  it("should return 400 for an empty body", async () => {
    const plantId = await seedPlant("Fern");
    const wateringId = await seedWatering(plantId, new Date(), false);

    const res = await app.request(`/api/plants/${plantId}/waterings/${wateringId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/plants/:id/waterings/:wateringId", () => {
  beforeEach(async () => {
    await cleanupTestDB();
  });

  it("should delete a single watering and leave the others", async () => {
    const plantId = await seedPlant("Fern");
    const now = new Date();
    const doomed = await seedWatering(plantId, now, false);
    const kept = await seedWatering(plantId, new Date(now.getTime() - 24 * 60 * 60 * 1000), false);

    const res = await app.request(`/api/plants/${plantId}/waterings/${doomed}`, { method: "DELETE" });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    const list = await app.request(`/api/plants/${plantId}/waterings`);
    const body = await list.json();
    expect(body.waterings).toEqual([expect.objectContaining({ id: kept })]);
  });

  it("should return 404 for a watering belonging to another plant", async () => {
    const plantId = await seedPlant("Fern");
    const otherPlantId = await seedPlant("Cactus");
    const wateringId = await seedWatering(otherPlantId, new Date(), false);

    const res = await app.request(`/api/plants/${plantId}/waterings/${wateringId}`, { method: "DELETE" });

    expect(res.status).toBe(404);

    const list = await app.request(`/api/plants/${otherPlantId}/waterings`);
    const body = await list.json();
    expect(body.waterings).toHaveLength(1);
  });

  it("should return 400 for a non-integer watering ID", async () => {
    const plantId = await seedPlant("Fern");

    const res = await app.request(`/api/plants/${plantId}/waterings/abc`, { method: "DELETE" });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/plants/:id/delay", () => {
  beforeEach(async () => {
    await cleanupTestDB();
  });

  it("should add a delay successfully", async () => {
    const plantId = await seedPlant("Orchid");

    const res = await app.request(`/api/plants/${plantId}/delay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numDays: 7 }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });

  it("should restart from now when the existing delay has expired", async () => {
    const plantId = await seedPlant("Cactus");
    await seedWatering(plantId, new Date(Date.now() - 10 * DAY));
    await seedWatering(plantId, new Date(Date.now() - 17 * DAY));
    // An old, expired delay must not block a new one
    await seedDelay(plantId, 3, new Date(Date.now() - 30 * DAY));

    const res = await app.request(`/api/plants/${plantId}/delay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numDays: 5 }),
    });

    expect(res.status).toBe(201);
    const [plant] = await getPlants();
    expect(plant?.daysUntilNextWatering).toBe(5);
  });

  it("should extend an active delay by the new number of days", async () => {
    const plantId = await seedPlant("Aloe");
    await seedWatering(plantId, new Date(Date.now() - 10 * DAY));
    await seedWatering(plantId, new Date(Date.now() - 17 * DAY));
    // 5-day delay set 2 days ago => 3 days remain
    await seedDelay(plantId, 5, new Date(Date.now() - 2 * DAY));

    const res = await app.request(`/api/plants/${plantId}/delay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numDays: 4 }),
    });

    expect(res.status).toBe(201);
    const [plant] = await getPlants();
    expect(plant?.daysUntilNextWatering).toBe(7);
  });

  it("should clear the delay when the plant is watered", async () => {
    const plantId = await seedPlant("Fig");
    await seedWatering(plantId, new Date(Date.now() - 7 * DAY));
    await seedDelay(plantId, 30, new Date());

    await app.request(`/api/plants/${plantId}/water`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fertilized: false }),
    });

    const [plant] = await getPlants();
    expect(plant?.daysUntilNextWatering).toBe(7);
  });

  it("should return 400 for a non-integer plant ID", async () => {
    const res = await app.request("/api/plants/abc/delay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numDays: 7 }),
    });

    expect(res.status).toBe(400);
  });

  it("should return 400 for an invalid numDays (zero)", async () => {
    const plantId = await seedPlant("Fern");

    const res = await app.request(`/api/plants/${plantId}/delay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numDays: 0 }),
    });

    expect(res.status).toBe(400);
  });

  it("should return 400 for an invalid numDays (non-integer)", async () => {
    const plantId = await seedPlant("Ivy");

    const res = await app.request(`/api/plants/${plantId}/delay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numDays: 1.5 }),
    });

    expect(res.status).toBe(400);
  });

  it("should return 400 for a missing numDays", async () => {
    const plantId = await seedPlant("Pothos");

    const res = await app.request(`/api/plants/${plantId}/delay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/plants/:id/classify", () => {
  beforeEach(async () => {
    await cleanupTestDB();
    vi.spyOn(global, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should classify a plant successfully", async () => {
    const plantId = await seedPlant("Dracaena");
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ matchType: "EXACT", scientificName: "Dracaena marginata" }), {
        status: 200,
      }),
    );

    const res = await app.request(`/api/plants/${plantId}/classify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ species: "Dracaena marginata" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });

  it("should return 422 for an unknown species", async () => {
    const plantId = await seedPlant("Mystery Plant");
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ matchType: "NONE" }), { status: 200 }),
    );

    const res = await app.request(`/api/plants/${plantId}/classify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ species: "xyzzy gibberish" }),
    });

    expect(res.status).toBe(422);
  });

  it("should return 400 for a non-integer plant ID", async () => {
    const res = await app.request("/api/plants/abc/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ species: "Dracaena marginata" }),
    });

    expect(res.status).toBe(400);
  });

  it("should return 400 for an invalid body", async () => {
    const plantId = await seedPlant("Rose");

    const res = await app.request(`/api/plants/${plantId}/classify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ species: 123 }),
    });

    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/plants/:id", () => {
  beforeEach(async () => {
    await cleanupTestDB();
  });

  it("should rename a plant successfully", async () => {
    const plantId = await seedPlant("Old Name");

    const res = await app.request(`/api/plants/${plantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Name" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });

  it("should return 400 for a non-integer plant ID", async () => {
    const res = await app.request("/api/plants/abc", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Name" }),
    });

    expect(res.status).toBe(400);
  });

  it("should return 400 for an invalid body", async () => {
    const plantId = await seedPlant("Some Plant");

    const res = await app.request(`/api/plants/${plantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: 123 }),
    });

    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/plants/:id", () => {
  beforeEach(async () => {
    await cleanupTestDB();
  });

  it("should soft delete the plant and keep its waterings", async () => {
    const plantId = await seedPlant("Fern");
    const otherId = await seedPlant("Cactus");
    await seedWatering(plantId, new Date(), false);
    await seedWatering(plantId, new Date(Date.now() - DAY), true);

    const res = await app.request(`/api/plants/${plantId}`, { method: "DELETE" });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    const listed = await getPlants();
    expect(listed.map((p) => p.id)).toEqual([otherId]);

    const [row] = await getDB().select().from(plants).where(eq(plants.id, plantId));
    expect(row?.deletedAt).toBeInstanceOf(Date);
    const kept = await getDB().select().from(waterings).where(eq(waterings.plantId, plantId));
    expect(kept).toHaveLength(2);
  });

  it("should return 404 for a plant that does not exist", async () => {
    const res = await app.request("/api/plants/999", { method: "DELETE" });

    expect(res.status).toBe(404);
  });

  it("should return 404 for an already deleted plant and keep the original deletedAt", async () => {
    const plantId = await seedPlant("Fern");
    await app.request(`/api/plants/${plantId}`, { method: "DELETE" });
    const [first] = await getDB().select().from(plants).where(eq(plants.id, plantId));

    const res = await app.request(`/api/plants/${plantId}`, { method: "DELETE" });

    expect(res.status).toBe(404);
    const [second] = await getDB().select().from(plants).where(eq(plants.id, plantId));
    expect(second?.deletedAt).toEqual(first?.deletedAt);
  });

  it("should return 400 for a non-integer plant ID", async () => {
    const res = await app.request("/api/plants/abc", { method: "DELETE" });

    expect(res.status).toBe(400);
  });
});
