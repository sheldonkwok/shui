# Plan: Switch MCP Implementation to @hono/mcp

## Context

The current `src/api/mcp.ts` manually implements the MCP JSON-RPC 2.0 protocol (~163 lines): request dispatch, version negotiation, tool definitions, error codes, etc. The `@hono/mcp` package wraps the official `@modelcontextprotocol/sdk` and handles all that plumbing via `McpServer` + `StreamableHTTPTransport`, reducing our code to ~60 lines of business logic only.

The tool logic (`runListPlants`, `runGetWateringHistory`) stays identical — only the transport/dispatch layer changes.

## What Changes

| | Before | After |
|---|---|---|
| Protocol dispatch | Manual `if (method === ...)` | SDK `McpServer` handles it |
| Version negotiation | Manual `SUPPORTED_VERSIONS` array | SDK handles it |
| Tool definition | Plain objects + runtime switch | `server.tool(name, schema, handler)` |
| Auth | Manual `Bearer` check in middleware | `bearerAuth()` from `@hono/mcp/auth` |
| HTTP transport | Manual `mcpApp.post("/mcp", ...)` | `StreamableHTTPTransport` + `transport.handleRequest(c)` |

`waku.server.tsx` is unchanged — the exported `mcpMiddleware` wrapper stays identical.

## Steps

### 1. Install packages

```bash
pnpm add @hono/mcp @modelcontextprotocol/sdk
```

### 2. Rewrite `src/api/mcp.ts`

Replace everything except the two tool implementation functions and the final `mcpMiddleware` export.

```typescript
import { StreamableHTTPTransport } from "@hono/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { desc, eq } from "drizzle-orm";
import { getDB } from "../db.ts";
import { waterings } from "../schema.ts";
import { listPlants } from "../actions/plants-helper.ts";

// Tool logic — unchanged from current implementation
async function runListPlants(): Promise<string> { ... }
async function runGetWateringHistory(plantId: number, limit = 20): Promise<string> { ... }

// SDK server with typed tools
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

// Hono app
const mcpApp = new Hono();

// Keep existing manual bearer auth (simple, proven, no extra import uncertainty)
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

// Waku middleware wrapper — unchanged
export const mcpMiddleware = createMiddleware(async (c, next) => {
  if (!c.req.path.startsWith("/mcp")) return await next();
  return mcpApp.fetch(c.req.raw);
});
```

**Notes:**
- `createMcpServer()` is called per-request (stateless — correct for Vercel serverless)
- `mcpApp.all` handles both `GET` (SSE) and `POST` (JSON-RPC) — the transport routes internally
- `z` from zod is used for tool input schemas; `@modelcontextprotocol/sdk` re-exports zod so no extra dep
- Manual bearer auth kept — `@hono/mcp`'s `bearerAuth` export is uncertain (may be Hono's own re-export)

### 3. No changes to `waku.server.tsx`

The `mcpMiddleware` export signature is identical.

## Critical Files

- **Modified**: `src/api/mcp.ts` — rewrite using SDK + transport (~60 lines vs 163)
- **Unchanged**: `src/waku.server.tsx`
- **Reused**: `src/actions/plants-helper.ts` → `listPlants()`
- **Reused**: `src/db.ts` → `getDB()`
- **Reused**: `src/schema.ts` → `waterings`

## Verification

1. `pnpm check && pnpm test` — all existing tests pass
2. Local smoke test:
   ```bash
   curl -X POST http://localhost:3000/mcp \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer test-key" \
     -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
   ```
3. Claude.ai integration unchanged — same URL and bearer token
