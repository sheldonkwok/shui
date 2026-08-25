import type { MiddlewareHandler } from "hono";
import { mcpApp } from "../api/mcp.ts";

/** Hands `/mcp` to the MCP streamable-HTTP transport. */
export default (): MiddlewareHandler => async (c, next) => {
  if (!c.req.path.startsWith("/mcp")) return await next();

  return mcpApp.fetch(c.req.raw);
};
