import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { serve, ServerType } from "@hono/node-server";
import { hc } from "hono/client";

import { execa } from "execa";

import app from "./app.ts";

describe("Plants API", () => {
  let server: ServerType;
  const client = hc<typeof app>(`http://localhost:3000`);

  beforeAll(async () => {
    await execa`rm -rf $TURSO_DATABASE_URL`;
    await execa`pnpm migrate`;

    await new Promise<void>((res) => (server = serve(app, () => res())));
  });

  afterAll(async () => {
    if (server) server.close();
  });

  const testPlantName = "Test Plant " + Date.now();

  it("should create a plant and then list it", async () => {
    // Create a plant using form data
    const formData = new FormData();
    formData.append("name", testPlantName);

    const createRes = await client.api.plants.$post({
      form: formData,
    });

    expect(createRes.ok).toBe(true);
    const createdPlant = await createRes.json();
    expect(createdPlant).toHaveProperty("id");
    expect(createdPlant).toHaveProperty("name", testPlantName);

    // List all plants using hono/client
    const listRes = await client.api.plants.$get();
    expect(listRes.ok).toBe(true);
    const allPlants = await listRes.json();

    const foundPlant = allPlants.find((plant) => plant.name === testPlantName);
    expect(foundPlant?.id).toBe(createdPlant.id);
  });

  it("should add a watering to an existing plant", async () => {
    // Create a plant using form data
    const formData = new FormData();
    formData.append("name", testPlantName + "_watering");

    const createRes = await client.api.plants.$post({
      form: formData,
    });

    const createdPlant = await createRes.json();
    expect(createdPlant).toHaveProperty("id");

    const wateringRes = await client.api.plants[":id"].water.$post({
      param: { id: createdPlant.id.toString() },
    });

    expect(wateringRes.status).toBe(302); // Redirect response
    expect(wateringRes.headers.get("location")).toBe("/");
  });
});
