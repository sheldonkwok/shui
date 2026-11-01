import { StreamableHTTPTransport } from "@hono/mcp";
import { bearerAuth, mcpAuthRouter } from "@hono/mcp/auth";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { desc, eq } from "drizzle-orm";
import { type Context, Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { z } from "zod";
import { addGardenPlant, getIrrigationSummary, listChores } from "../actions/garden-helper.ts";
import { listPlants } from "../actions/plants-helper.ts";
import { ALLOWED_EMAIL, getSessionEmail } from "../auth.ts";
import { getDB } from "../db.ts";
import { formatMonthRange } from "../garden-utils.ts";
import { fetchImage, lookupSpecies, type SpeciesMatch } from "../gbif.ts";
import { createOAuthProvider, type OAuthProviderOptions } from "../oauth.ts";
import { waterings } from "../schema.ts";
import { IS_DEV, IS_PREVIEW, IS_PRODUCTION, IS_TEST } from "../utils.ts";

async function runListPlants(): Promise<string> {
  const plants = await listPlants();

  if (plants.length === 0) return "No plants found.";

  const lines = plants.map((p) => {
    const name = p.species ? `${p.name} (${p.species})` : p.name;
    if (p.location === "outdoor") return `- [ID ${p.id}] ${name}: outdoors, watered by irrigation`;
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

async function runGetGarden(): Promise<string> {
  const [irrigation, chores] = await Promise.all([getIrrigationSummary(), listChores()]);

  const lastRun = irrigation.lastRun ? irrigation.lastRun.toISOString().split("T")[0] : "never";
  const next =
    irrigation.daysUntilNextRun === null
      ? ""
      : irrigation.daysUntilNextRun < 0
        ? `, OVERDUE by ${Math.abs(irrigation.daysUntilNextRun)} days`
        : `, next due in ${irrigation.daysUntilNextRun} days`;
  const choreLines = chores.map((ch) => {
    const target = ch.plantName ? ` (${ch.plantName})` : "";
    return `- [ID ${ch.id}] ${ch.title}${target}, ${formatMonthRange(ch.startMonth, ch.endMonth)}: ${ch.status}`;
  });

  return [
    `Irrigation: last run ${lastRun}${next}`,
    chores.length ? `Seasonal chores:\n${choreLines.join("\n")}` : "No seasonal chores.",
  ].join("\n");
}

/** USDA hardiness zone of the garden, which sets when its plants should be pruned. */
export const GARDEN_ZONE = "10b";

// How many reference photos are shown inline; more are listed as links.
const INLINE_PHOTOS = 3;

const ADD_GARDEN_PLANT_STEPS = `Adding a plant to the outdoor garden from a photo (USDA zone ${GARDEN_ZONE}):
1. Look at the user's photo and suggest the most likely species, with a runner-up or two if you are unsure. Explain the visible features (leaves, flowers, bark, habit) that point to it.
2. Call lookup_species with the scientific name of your best guess. Show the user its accepted name, common names and reference photos so they can compare them with their plant. Look up a runner-up the same way if the user asks or the photos don't fit.
3. Ask the user to confirm the species. Do not continue until they do; if they correct you, look up their species instead.
4. Suggest when to prune this species in USDA zone ${GARDEN_ZONE} (mild, frost-free winters, long warm growing season): the month window, what kind of pruning, and why. Some plants need more than one window (e.g. a hard prune and a summer tidy-up). Cite your sources for this advice as links, preferring university extension services for warm, frost-free climates (e.g. UC Agriculture and Natural Resources, UF/IFAS Extension) and botanical gardens; search the web for them if you can. Say plainly if you could not find a source for a recommendation.
5. Ask the user to confirm or adjust the pruning windows, and what to name the plant (suggest its common name).
6. Only after both the species and the pruning windows are confirmed, call add_garden_plant.`;

function describeMatch(m: SpeciesMatch): string {
  const family = m.family ? `, family ${m.family}` : "";
  return `${m.scientificName} (${m.rank.toLowerCase()}${family}; ${m.matchType.toLowerCase()} match, ${m.confidence}% confidence)`;
}

type ToolContent = { type: "text"; text: string } | { type: "image"; data: string; mimeType: string };

async function runLookupSpecies(name: string): Promise<ToolContent[]> {
  const result = await lookupSpecies(name, 6);
  if (!result) {
    return [{ type: "text", text: `GBIF has no plant matching "${name}". Try another scientific name.` }];
  }
  const { match, commonNames, alternatives, photos } = result;

  const lines = [`Best match: ${describeMatch(match)}`];
  if (match.status !== "ACCEPTED")
    lines.push(`Note: "${match.scientificName}" is a ${match.status.toLowerCase()} name.`);
  if (match.rank !== "SPECIES" && match.rank !== "SUBSPECIES" && match.rank !== "VARIETY") {
    lines.push("Note: this only matched above species level; try a more specific name.");
  }
  lines.push(`Species to store: ${match.canonicalName}`);
  lines.push(commonNames.length ? `Common names: ${commonNames.join(", ")}` : "Common names: none listed");
  if (alternatives.length) {
    lines.push(`Other candidates:\n${alternatives.map((a) => `- ${describeMatch(a)}`).join("\n")}`);
  }
  if (photos.length) {
    const photoLines = photos.map((p, i) => {
      const credit = [p.credit, p.license].filter(Boolean).join(", ");
      return `${i + 1}. ${p.url} (source: ${p.sourceUrl}${credit ? `; ${credit}` : ""})`;
    });
    lines.push(`Reference photos:\n${photoLines.join("\n")}`);
  } else {
    lines.push("Reference photos: none found on GBIF.");
  }

  const images = await Promise.all(photos.slice(0, INLINE_PHOTOS).map((p) => fetchImage(p.url)));
  return [
    { type: "text", text: lines.join("\n") },
    ...images.filter((img) => img !== null).map((img) => ({ type: "image" as const, ...img })),
  ];
}

async function runAddGardenPlant(input: Parameters<typeof addGardenPlant>[0]): Promise<string> {
  const { plantId, choreIds } = await addGardenPlant(input);
  const windows = input.pruning.map(
    (p, i) => `- [Chore ID ${choreIds[i]}] ${p.title}, ${formatMonthRange(p.startMonth, p.endMonth)}`,
  );
  return [
    `Added ${input.name} (${input.species}) to the garden as plant ID ${plantId}. It is watered by irrigation.`,
    windows.length ? `Pruning chores:\n${windows.join("\n")}` : "No pruning chores.",
  ].join("\n");
}

const month = z.number().int().min(1).max(12);

export function createMcpServer() {
  const server = new McpServer(
    { name: "shui-plants", version: "1.0.0" },
    { instructions: `Tracks indoor plant waterings and an outdoor garden.\n\n${ADD_GARDEN_PLANT_STEPS}` },
  );

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

  server.tool(
    "get_garden",
    "Get the outdoor garden's irrigation status and seasonal chores (due, done this season, or upcoming).",
    {},
    async () => ({
      content: [{ type: "text", text: await runGetGarden() }],
    }),
  );

  server.registerTool(
    "lookup_species",
    {
      title: "Look up plant species",
      description:
        "Look a plant up by scientific name in GBIF: its accepted name, family, common names, close alternatives, " +
        "and reference photos of the species to compare with the user's photo. Use it after suggesting a species " +
        "from a photo, before adding a garden plant.",
      inputSchema: { name: z.string().min(1).describe("Scientific name, e.g. 'Bougainvillea glabra'.") },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ name }) => ({ content: await runLookupSpecies(name) }),
  );

  server.registerTool(
    "add_garden_plant",
    {
      title: "Add garden plant",
      description:
        "Add an outdoor plant to the garden with its yearly pruning chores. Only call this after the user has " +
        `confirmed both the species (via lookup_species) and the pruning windows for USDA zone ${GARDEN_ZONE}.`,
      inputSchema: {
        name: z.string().trim().min(1).describe("What the user calls the plant, e.g. 'Front bougainvillea'."),
        species: z
          .string()
          .trim()
          .min(1)
          .describe("The confirmed species, as 'Species to store' from lookup_species."),
        pruning: z
          .array(
            z.object({
              title: z.string().trim().min(1).describe("The chore, e.g. 'Hard prune' or 'Deadhead'."),
              startMonth: month.describe("First month of the window (1 = January)."),
              endMonth: month.describe(
                "Last month of the window; may be before startMonth to wrap the new year.",
              ),
            }),
          )
          .min(1)
          .describe("When to prune each year, as confirmed by the user."),
      },
    },
    async (input) => ({ content: [{ type: "text", text: await runAddGardenPlant(input) }] }),
  );

  server.registerPrompt(
    "add_garden_plant",
    {
      title: "Add a garden plant from a photo",
      description: `Identify a plant from a photo, confirm it, plan its pruning for zone ${GARDEN_ZONE}, then add it to the garden.`,
    },
    () => ({
      messages: [
        {
          role: "user",
          content: { type: "text", text: `${ADD_GARDEN_PLANT_STEPS}\n\nStart with the photo I've attached.` },
        },
      ],
    }),
  );

  return server;
}

const OAUTH_ROUTE_PATHS = ["/authorize", "/token", "/register", "/.well-known/oauth-"];

/** The public origin that OAuth metadata advertises. */
function publicOrigin(c: Context): string {
  return IS_PRODUCTION ? "https://shui.fmj.io" : new URL(c.req.url).origin;
}

const noRateLimit = { rateLimit: false } as const;

/**
 * The MCP endpoint plus its OAuth server (client registration, authorize, token and discovery metadata).
 * Pass `getEmail` to control how the signed-in user is found.
 */
export function createMcpApp({ getEmail }: OAuthProviderOptions) {
  const provider = createOAuthProvider({ getEmail });
  const app = new Hono();

  const unauthorized = (c: Context) =>
    `Bearer error="Unauthorized", resource_metadata="${publicOrigin(c)}/.well-known/oauth-protected-resource/mcp"`;

  app.use(
    "/mcp",
    bearerAuth({
      verifyToken: async (token) =>
        await provider.verifyAccessToken(token).then(
          () => true,
          () => false,
        ),
      noAuthenticationHeader: { wwwAuthenticateHeader: unauthorized },
      invalidAuthenticationHeader: { wwwAuthenticateHeader: unauthorized },
      invalidToken: { wwwAuthenticateHeader: unauthorized },
    }),
  );

  app.all("/mcp", async (c) => {
    const server = createMcpServer();
    const transport = new StreamableHTTPTransport();
    await server.connect(transport);
    return transport.handleRequest(c);
  });

  // The router fixes its issuer URL when built, so build it for the origin each request arrives on.
  app.all("*", (c) => {
    const origin = publicOrigin(c);
    const router = mcpAuthRouter({
      // biome-ignore lint/suspicious/noExplicitAny: the SDK types authorize() for Express; hono passes a Context
      provider: provider as any,
      issuerUrl: origin,
      resourceServerUrl: new URL("/mcp", origin),
      resourceName: "Shui",
      authorizationOptions: noRateLimit,
      tokenOptions: noRateLimit,
      clientRegistrationOptions: { ...noRateLimit, clientIdGeneration: false },
    });
    return router.fetch(c.req.raw);
  });

  return app;
}

const mcpApp = createMcpApp({
  // Like authCheckMiddleware, dev and preview skip login; production needs the Google session cookie.
  getEmail: async (c) => (IS_TEST || IS_PREVIEW || IS_DEV ? ALLOWED_EMAIL : await getSessionEmail(c)),
});

export const mcpMiddleware = createMiddleware(async (c, next) => {
  const isMcpRoute = c.req.path.startsWith("/mcp") || OAUTH_ROUTE_PATHS.some((p) => c.req.path.startsWith(p));
  if (!isMcpRoute) return await next();
  return mcpApp.fetch(c.req.raw);
});
