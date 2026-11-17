import { asc } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDB } from "./db.ts";
import { fetchRecentRain, recordRainWaterings } from "./rain.ts";
import { irrigationRuns } from "./schema.ts";
import { cleanupTestDB } from "./test-utils.ts";

// 9 AM PST on Nov 17, 2026 (17:00 UTC).
const NOW = new Date("2026-11-17T17:00:00Z");
const PST_OFFSET = -8 * 60 * 60;

function mockOpenMeteo(precipitation: Record<string, number | null>) {
  const fetchMock = vi.fn(async (_input: string | URL | Request) =>
    Response.json({
      utc_offset_seconds: PST_OFFSET,
      daily: { time: Object.keys(precipitation), precipitation_sum: Object.values(precipitation) },
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchRecentRain", () => {
  it("asks for daily rain in inches at the garden, local to San Francisco", async () => {
    const fetchMock = mockOpenMeteo({ "2026-11-17": 0 });

    await fetchRecentRain(NOW);

    const url = new URL(String(fetchMock.mock.calls[0]![0]));
    expect(url.searchParams.get("daily")).toBe("precipitation_sum");
    expect(url.searchParams.get("precipitation_unit")).toBe("inch");
    expect(url.searchParams.get("timezone")).toBe("America/Los_Angeles");
    expect(Number(url.searchParams.get("latitude"))).toBeCloseTo(37.8, 1);
    expect(Number(url.searchParams.get("longitude"))).toBeCloseTo(-122.44, 1);
  });

  it("leaves out today and days with no data, and ends each day at local midnight", async () => {
    mockOpenMeteo({ "2026-11-14": null, "2026-11-15": 0.2, "2026-11-16": 1.4, "2026-11-17": 2 });

    const days = await fetchRecentRain(NOW);

    expect(days).toEqual([
      { date: "2026-11-15", inches: 0.2, endOfDay: new Date("2026-11-16T07:59:59Z") },
      { date: "2026-11-16", inches: 1.4, endOfDay: new Date("2026-11-17T07:59:59Z") },
    ]);
  });

  it("throws when Open-Meteo fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("oops", { status: 500 })),
    );

    await expect(fetchRecentRain(NOW)).rejects.toThrow("Open-Meteo request failed (500)");
  });
});

describe("recordRainWaterings", () => {
  beforeEach(async () => {
    await cleanupTestDB();
  });

  async function runs() {
    return getDB()
      .select({ runTime: irrigationRuns.runTime, rainDate: irrigationRuns.rainDate })
      .from(irrigationRuns)
      .orderBy(asc(irrigationRuns.runTime));
  }

  it("logs an irrigation run only for days with more than an inch of rain", async () => {
    mockOpenMeteo({ "2026-11-14": 1, "2026-11-15": 1.01, "2026-11-16": 0.5, "2026-11-17": 3 });

    const recorded = await recordRainWaterings(NOW);

    expect(recorded.map((d) => d.date)).toEqual(["2026-11-15"]);
    expect(await runs()).toEqual([{ runTime: new Date("2026-11-16T07:59:59Z"), rainDate: "2026-11-15" }]);
  });

  it("logs each rainy day once however often it runs", async () => {
    mockOpenMeteo({ "2026-11-15": 1.5, "2026-11-16": 2, "2026-11-17": 0 });

    await recordRainWaterings(NOW);
    const second = await recordRainWaterings(NOW);

    expect(second).toEqual([]);
    expect((await runs()).map((r) => r.rainDate)).toEqual(["2026-11-15", "2026-11-16"]);
  });

  it("leaves hand-started runs alone", async () => {
    await getDB()
      .insert(irrigationRuns)
      .values({ runTime: new Date("2026-11-16T20:00:00Z") });
    mockOpenMeteo({ "2026-11-16": 0, "2026-11-17": 0 });

    await recordRainWaterings(NOW);

    expect(await runs()).toEqual([{ runTime: new Date("2026-11-16T20:00:00Z"), rainDate: null }]);
  });
});
