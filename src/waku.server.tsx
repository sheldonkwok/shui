import vercelAdapter from "waku/adapters/vercel";
import { fsRouter } from "waku/router/server";
import { apiMiddleware } from "./api/index.ts";
import { authMiddleware } from "./auth.ts";

const server: ReturnType<typeof vercelAdapter> = vercelAdapter(
  fsRouter(import.meta.glob("./**/*.{tsx,ts}", { base: "./pages" })),
  {
    middlewareFns: [() => authMiddleware, () => apiMiddleware],
  },
);

export default server;
