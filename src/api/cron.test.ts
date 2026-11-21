import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDB } from "../db.ts";
import { irrigationRuns } from "../schema.ts";
import { cleanupTestDB } from "../test-utils.ts";
import { cronApp } from "./cron.ts";

function mockOpenMeteo(precipitation: Record<string, number>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        utc_offset_seconds: -8 * 60 * 60,
        daily: { time: Object.keys(precipitation), precipitation_sum: Object.values(precipitation) },
      }),
    ),
  );
}

function recordRain(token?: string) {
  return cronApp.request("/cron/record-rain", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

describe("GET /cron/record-rain", () => {
  beforeEach(async () => {
    await cleanupTestDB();
    vi.stubEnv("CRON_SECRET", "cron-secret");
    // A day long past, and one still to come, which is never counted.
    mockOpenMeteo({ "2000-01-01": 1.5, "2100-01-01": 0 });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("records a garden watering for a day with over an inch of rain", async () => {
    const res = await recordRain("cron-secret");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ recorded: [{ date: "2000-01-01", inches: 1.5 }] });
    const runs = await getDB().select({ rainDate: irrigationRuns.rainDate }).from(irrigationRuns);
    expect(runs).toEqual([{ rainDate: "2000-01-01" }]);
  });

  it("refuses requests without the cron secret", async () => {
    expect((await recordRain()).status).toBe(401);
    expect((await recordRain("wrong")).status).toBe(401);
    expect(await getDB().select().from(irrigationRuns)).toEqual([]);
  });

  it("refuses every request while CRON_SECRET is unset", async () => {
    vi.stubEnv("CRON_SECRET", "");

    expect((await recordRain("")).status).toBe(503);
    expect((await recordRain("cron-secret")).status).toBe(503);
  });
});
