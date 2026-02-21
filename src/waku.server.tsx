import vercelAdapter from "waku/adapters/vercel";
import { fsRouter } from "waku/router/server";
import { apiMiddleware } from "./api/index.ts";
import { authRoutesMiddleware, previewAuthMiddleware } from "./auth.ts";
import { IS_PREVIEW } from "./utils.ts";

const server: ReturnType<typeof vercelAdapter> = vercelAdapter(
  fsRouter(import.meta.glob("./**/*.{tsx,ts}", { base: "./pages" })),
  {
    middlewareFns: [
      () => authRoutesMiddleware,
      ...(IS_PREVIEW ? [() => previewAuthMiddleware] : []),
      () => apiMiddleware,
    ],
  },
);

export default server;
