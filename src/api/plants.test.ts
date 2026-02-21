import { beforeEach, describe, expect, it } from "vitest";
import { cleanupTestDB, seedPlant } from "../test-utils.ts";
import { app } from "./index.ts";

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
