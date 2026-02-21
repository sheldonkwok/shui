import vercelAdapter from "waku/adapters/vercel";
import { fsRouter } from "waku/router/server";
import { apiMiddleware } from "./api/index.ts";
import { authRoutesMiddleware } from "./auth.ts";

const server: ReturnType<typeof vercelAdapter> = vercelAdapter(
  fsRouter(import.meta.glob("./**/*.{tsx,ts}", { base: "./pages" })),
  {
    middlewareFns: [() => authRoutesMiddleware, () => apiMiddleware],
  },
);

export default server;
