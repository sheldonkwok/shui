import { beforeEach, describe, expect, it } from "vitest";
import { cleanupTestDB, seedPlant } from "../test-utils.ts";
import { app } from "./index.ts";

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
    expect(body).toEqual({ ok: true });
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

  it("should return 409 when a delay already exists for the plant", async () => {
    const plantId = await seedPlant("Cactus");

    await app.request(`/api/plants/${plantId}/delay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numDays: 3 }),
    });

    const res = await app.request(`/api/plants/${plantId}/delay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numDays: 5 }),
    });

    expect(res.status).toBe(409);
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
