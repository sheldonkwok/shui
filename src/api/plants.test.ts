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
