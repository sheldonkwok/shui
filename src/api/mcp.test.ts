import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getGarden } from "../actions/garden.ts";
import { getDB } from "../db.ts";
import { plants } from "../schema.ts";
import { cleanupTestDB } from "../test-utils.ts";
import { createMcpServer } from "./mcp.ts";

async function connect() {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await createMcpServer().connect(serverTransport);
  const client = new Client({ name: "test", version: "1.0.0" });
  await client.connect(clientTransport);
  return client;
}

type Content = { type: string; text?: string; data?: string; mimeType?: string }[];

describe("MCP garden plant flow", () => {
  beforeEach(async () => {
    await cleanupTestDB();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("explains the photo flow for zone 10b in its instructions and prompt", async () => {
    const client = await connect();

    expect(client.getInstructions()).toContain("zone 10b");
    const prompt = await client.getPrompt({ name: "add_garden_plant" });
    const message = prompt.messages[0]!.content;
    expect(message.type === "text" && message.text).toContain("lookup_species");
  });

  it("looks up a species with reference photos inline", async () => {
    vi.stubGlobal("fetch", async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("/species/match")) {
        return Response.json({
          usageKey: 100,
          scientificName: "Bougainvillea glabra Choisy",
          canonicalName: "Bougainvillea glabra",
          rank: "SPECIES",
          status: "ACCEPTED",
          confidence: 97,
          matchType: "EXACT",
          family: "Nyctaginaceae",
        });
      }
      if (url.includes("/vernacularNames")) {
        return Response.json({ results: [{ vernacularName: "Lesser bougainvillea", language: "eng" }] });
      }
      if (url.includes("/occurrence/search")) {
        return Response.json({
          results: [{ key: 1, media: [{ type: "StillImage", identifier: "https://example.com/1.jpg" }] }],
        });
      }
      return new Response("img", { headers: { "content-type": "image/jpeg" } });
    });
    const client = await connect();

    const result = await client.callTool({
      name: "lookup_species",
      arguments: { name: "Bougainvillea glabra" },
    });

    const content = result.content as Content;
    expect(content[0]!.text).toContain("Species to store: Bougainvillea glabra");
    expect(content[0]!.text).toContain("Common names: Lesser bougainvillea");
    expect(content[0]!.text).toContain("https://www.gbif.org/occurrence/1");
    expect(content[1]).toMatchObject({ type: "image", mimeType: "image/jpeg" });
  });

  it("reports when GBIF has no match", async () => {
    vi.stubGlobal("fetch", async () => Response.json({ matchType: "NONE" }));
    const client = await connect();

    const result = await client.callTool({ name: "lookup_species", arguments: { name: "Zzz" } });

    expect((result.content as Content)[0]!.text).toContain('no plant matching "Zzz"');
  });

  it("adds an outdoor plant with its pruning chores", async () => {
    const client = await connect();

    const result = await client.callTool({
      name: "add_garden_plant",
      arguments: {
        name: "Front bougainvillea",
        species: "Bougainvillea glabra",
        pruning: [
          { title: "Hard prune", startMonth: 1, endMonth: 2 },
          { title: "Tip prune", startMonth: 6, endMonth: 8 },
        ],
      },
    });

    expect((result.content as Content)[0]!.text).toContain("Hard prune, Jan–Feb");
    expect(await getDB().select().from(plants)).toEqual([
      expect.objectContaining({
        name: "Front bougainvillea",
        species: "Bougainvillea glabra",
        location: "outdoor",
      }),
    ]);
    const { chores } = await getGarden();
    expect(chores.map((c) => [c.title, c.startMonth, c.endMonth, c.plantName]).sort()).toEqual([
      ["Hard prune", 1, 2, "Front bougainvillea"],
      ["Tip prune", 6, 8, "Front bougainvillea"],
    ]);
  });

  it("rejects a plant without pruning windows", async () => {
    const client = await connect();

    const result = await client.callTool({
      name: "add_garden_plant",
      arguments: { name: "Rose", species: "Rosa", pruning: [] },
    });

    expect(result.isError).toBe(true);
    expect(await getDB().select().from(plants)).toEqual([]);
  });
});
