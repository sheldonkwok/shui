import { afterEach, describe, expect, it, vi } from "vitest";
import { lookupSpecies } from "./gbif.ts";

const MATCH = {
  usageKey: 100,
  speciesKey: 100,
  scientificName: "Bougainvillea glabra Choisy",
  canonicalName: "Bougainvillea glabra",
  rank: "SPECIES",
  status: "ACCEPTED",
  confidence: 97,
  matchType: "EXACT",
  family: "Nyctaginaceae",
  genus: "Bougainvillea",
  alternatives: [
    {
      ...{
        usageKey: 101,
        scientificName: "Bougainvillea spectabilis Willd.",
        canonicalName: "Bougainvillea spectabilis",
      },
      rank: "SPECIES",
      status: "ACCEPTED",
      confidence: 40,
      matchType: "FUZZY",
    },
  ],
};

function mockGbif(routes: Record<string, unknown>) {
  const fetchMock = vi.fn(async (input: string | URL | Request) => {
    const url = String(input);
    const route = Object.keys(routes).find((r) => url.includes(r));
    if (!route) return new Response("not found", { status: 404 });
    return Response.json(routes[route]);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("lookupSpecies", () => {
  it("returns the match with common names and alternatives", async () => {
    mockGbif({
      "/species/match": MATCH,
      "/species/100/vernacularNames": {
        results: [
          { vernacularName: "Lesser bougainvillea", language: "eng" },
          { vernacularName: "lesser bougainvillea", language: "eng" },
          { vernacularName: "Bougainvillée", language: "fra" },
        ],
      },
    });

    const result = await lookupSpecies("bougainvillea glabra");

    expect(result?.match).toMatchObject({ canonicalName: "Bougainvillea glabra", family: "Nyctaginaceae" });
    expect(result?.commonNames).toEqual(["Lesser bougainvillea"]);
    expect(result?.alternatives.map((a) => a.canonicalName)).toEqual(["Bougainvillea spectabilis"]);
  });

  it("returns null when GBIF has no match", async () => {
    mockGbif({ "/species/match": { matchType: "NONE", confidence: 100 } });
    expect(await lookupSpecies("not a plant")).toBeNull();
  });

  it("still returns the match when common names fail", async () => {
    mockGbif({ "/species/match": MATCH });
    const result = await lookupSpecies("Bougainvillea glabra");
    expect(result).toMatchObject({ commonNames: [] });
  });

  it("looks common names up under the accepted name of a synonym", async () => {
    const fetchMock = mockGbif({
      "/species/match": { ...MATCH, usageKey: 5, speciesKey: 100, status: "SYNONYM" },
      "/vernacularNames": { results: [] },
    });
    await lookupSpecies("Old name");
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toContainEqual(
      expect.stringContaining("/species/100/vernacularNames"),
    );
  });

  it("retries a rate-limited (429) request", async () => {
    vi.useFakeTimers();
    let calls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        if (String(input).includes("/species/match")) {
          return ++calls < 2 ? new Response("slow down", { status: 429 }) : Response.json(MATCH);
        }
        return Response.json({ results: [] });
      }),
    );
    const pending = lookupSpecies("Bougainvillea glabra");
    await vi.advanceTimersByTimeAsync(5000);
    const result = await pending;
    vi.useRealTimers();
    expect(calls).toBe(2);
    expect(result?.match.canonicalName).toBe("Bougainvillea glabra");
  });
});
