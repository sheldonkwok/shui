import type { APIRoute } from "astro";
import app from "../app.ts";

export const ALL: APIRoute = (context) => app.fetch(context.request);
