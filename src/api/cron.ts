import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { createMiddleware } from "hono/factory";
import { recordRainWaterings } from "../rain.ts";

/**
 * Paths Vercel Cron Jobs call on the production deployment (scheduled in
 * scripts/vercel-crons.ts). Times are UTC.
 */
export const CRONS = [
  // 7:23 AM PST / 8:23 AM PDT, after the previous day has ended.
  { path: "/cron/record-rain", schedule: "23 15 * * *" },
];

// Vercel sends `Authorization: Bearer $CRON_SECRET` with each cron request. These
// routes skip the Google sign-in, so they refuse every request until the secret is set.
const cronAuth = createMiddleware(async (c, next) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) return c.text("CRON_SECRET is not set", 503);
  return bearerAuth({ token: secret })(c, next);
});

export const cronApp = new Hono()
  .basePath("/cron")
  .use(cronAuth)
  .get("/record-rain", async (c) => {
    const recorded = await recordRainWaterings();
    return c.json({ recorded: recorded.map(({ date, inches }) => ({ date, inches })) });
  });

export const cronMiddleware = createMiddleware(async (c, next) => {
  if (!c.req.path.startsWith("/cron/")) return await next();
  return cronApp.fetch(c.req.raw);
});
