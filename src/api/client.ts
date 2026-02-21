import { hc } from "hono/client";
import type { AppType } from "./index.ts";

export const apiClient = hc<AppType>(window.location.origin);
