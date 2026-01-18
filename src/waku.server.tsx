import { fsRouter } from "waku/router/server";
import vercelAdapter from "waku/adapters/vercel";
import { ipRestrictionMiddleware } from "./auth-ip.ts";

export default vercelAdapter(
  fsRouter(import.meta.glob("./**/*.{tsx,ts}", { base: "./pages" })),
  {
    middlewareFns: [() => ipRestrictionMiddleware],
  }
);
