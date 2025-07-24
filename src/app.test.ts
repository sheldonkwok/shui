import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { serve, ServerType } from "@hono/node-server";
import app from "./app.js";
import { hc } from "hono/client";

describe("Plants API", () => {
  let server: ServerType;
  const client = hc<typeof app>(`http://localhost:3000`);

  beforeAll(async () => {
    await new Promise<void>((res) => (server = serve(app, () => res())));
  });

  afterAll(async () => {
    if (server) server.close();
  });

  it("should create a plant and then list it", async () => {
    const testPlantName = "Test Plant " + Date.now();

    // Create a plant using hono/client
    const createRes = await client.plants.$post({
      json: { name: testPlantName },
    });

    expect(createRes.ok).toBe(true);
    const createdPlant = await createRes.json();
    expect(createdPlant).toHaveProperty("id");
    expect(createdPlant).toHaveProperty("name", testPlantName);

    // List all plants using hono/client
    const listRes = await client.plants.$get();
    expect(listRes.ok).toBe(true);
    const allPlants = await listRes.json();

    const foundPlant = allPlants.find((plant) => plant.name === testPlantName);
    expect(foundPlant?.id).toBe(createdPlant.id);
  });

  it("should add a watering to an existing plant", async () => {
    const testPlantName = "Test Plant " + Date.now();

    const createRes = await client.plants.$post({
      json: { name: testPlantName },
    });

    expect(createRes.ok).toBe(true);
    const createdPlant = await createRes.json();
    expect(createdPlant).toHaveProperty("id");
    expect(createdPlant).toHaveProperty("name", testPlantName);
  });
});
