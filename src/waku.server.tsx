import adapter from "waku/adapters/default";
import { fsRouter } from "waku/router/server";
import { apiMiddleware } from "./api/index.ts";
import { mcpMiddleware } from "./api/mcp.ts";
import { authRoutesMiddleware, previewAuthMiddleware } from "./auth.ts";
import { IS_DEV, IS_PREVIEW } from "./utils.ts";

// adapter is resolved at build time to waku/adapters/vercel or waku/adapters/node
// based on the unstable_adapter setting in waku.config.ts
const server: ReturnType<typeof adapter> = adapter(fsRouter(import.meta.glob("./pages/**/*.{tsx,ts}")), {
  middlewareFns: [
    () => authRoutesMiddleware,
    ...(IS_PREVIEW || IS_DEV ? [() => previewAuthMiddleware] : []),
    () => mcpMiddleware,
    () => apiMiddleware,
  ],
});

export default server;
