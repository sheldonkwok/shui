import vercelAdapter from "waku/adapters/vercel";
import { fsRouter } from "waku/router/server";
import { authMiddleware } from "./auth.ts";

export default vercelAdapter(fsRouter(import.meta.glob("./**/*.{tsx,ts}", { base: "./pages" })), {
  middlewareFns: [() => authMiddleware],
});
