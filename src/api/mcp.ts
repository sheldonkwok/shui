import { StreamableHTTPTransport } from "@hono/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { z } from "zod";
import { listPlants } from "../actions/plants-helper.ts";
import { getDB } from "../db.ts";
import { waterings } from "../schema.ts";

async function runListPlants(): Promise<string> {
  const plants = await listPlants();

  if (plants.length === 0) return "No plants found.";

  const sorted = [...plants].sort((a, b) => {
    const aVal = a.daysUntilNextWatering ?? Infinity;
    const bVal = b.daysUntilNextWatering ?? Infinity;
    return aVal - bVal;
  });

  const lines = sorted.map((p) => {
    const name = p.species ? `${p.name} (${p.species})` : p.name;
    if (p.daysUntilNextWatering === null) {
      return `- [ID ${p.id}] ${name}: no watering data yet`;
    }
    const days = p.daysUntilNextWatering;
    const status =
      days < 0 ? `OVERDUE by ${Math.abs(days)} days` : days === 0 ? "due today" : `due in ${days} days`;
    return `- [ID ${p.id}] ${name}: ${status}`;
  });

  return `Plants (${plants.length} total):\n${lines.join("\n")}`;
}

async function runGetWateringHistory(plantId: number, limit: number = 20): Promise<string> {
  const rows = await getDB()
    .select()
    .from(waterings)
    .where(eq(waterings.plantId, plantId))
    .orderBy(desc(waterings.wateringTime))
    .limit(limit);

  if (rows.length === 0) return `No watering history found for plant ID ${plantId}.`;

  const lines = rows.map((r) => {
    const date = new Date(r.wateringTime).toISOString().split("T")[0];
    return `- ${date}${r.fertilized ? " (fertilized)" : ""}`;
  });

  return `Watering history for plant ID ${plantId}:\n${lines.join("\n")}`;
}

function createMcpServer() {
  const server = new McpServer({ name: "shui-plants", version: "1.0.0" });

  server.tool("list_plants", "List all plants sorted by watering urgency.", {}, async () => ({
    content: [{ type: "text", text: await runListPlants() }],
  }));

  server.tool(
    "get_watering_history",
    "Get the watering history for a specific plant.",
    { plantId: z.number(), limit: z.number().optional() },
    async ({ plantId, limit }) => ({
      content: [{ type: "text", text: await runGetWateringHistory(plantId, limit) }],
    }),
  );

  return server;
}

const mcpApp = new Hono();

mcpApp.use("/mcp", async (c, next) => {
  const apiKey = process.env.MCP_API_KEY;
  if (apiKey) {
    const auth = c.req.header("Authorization");
    if (!auth || auth !== `Bearer ${apiKey}`) {
      return c.json({ error: "Unauthorized" }, 401);
    }
  }
  return await next();
});

mcpApp.all("/mcp", async (c) => {
  const server = createMcpServer();
  const transport = new StreamableHTTPTransport();
  await server.connect(transport);
  return transport.handleRequest(c);
});

export const mcpMiddleware = createMiddleware(async (c, next) => {
  if (!c.req.path.startsWith("/mcp")) return await next();
  return mcpApp.fetch(c.req.raw);
});
