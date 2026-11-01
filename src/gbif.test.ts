import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchImage, lookupSpecies, webSizedPhotoUrl } from "./gbif.ts";

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
  it("returns the match with common names, alternatives and one photo per observation", async () => {
    mockGbif({
      "/species/match": MATCH,
      "/species/100/vernacularNames": {
        results: [
          { vernacularName: "Lesser bougainvillea", language: "eng" },
          { vernacularName: "lesser bougainvillea", language: "eng" },
          { vernacularName: "Bougainvillée", language: "fra" },
        ],
      },
      "/occurrence/search": {
        results: [
          {
            key: 1,
            media: [
              {
                type: "StillImage",
                identifier: "https://inaturalist-open-data.s3.amazonaws.com/photos/9/original.jpeg",
                rightsHolder: "Ana",
                license: "CC BY 4.0",
              },
              { type: "StillImage", identifier: "https://example.com/second.jpg" },
            ],
          },
          { key: 2, media: [{ type: "Sound", identifier: "https://example.com/a.mp3" }] },
          { key: 3, media: [{ type: "StillImage", identifier: "https://example.com/three.jpg" }] },
        ],
      },
    });

    const result = await lookupSpecies("bougainvillea glabra");

    expect(result?.match).toMatchObject({ canonicalName: "Bougainvillea glabra", family: "Nyctaginaceae" });
    expect(result?.commonNames).toEqual(["Lesser bougainvillea"]);
    expect(result?.alternatives.map((a) => a.canonicalName)).toEqual(["Bougainvillea spectabilis"]);
    expect(result?.photos).toEqual([
      {
        url: "https://inaturalist-open-data.s3.amazonaws.com/photos/9/medium.jpeg",
        sourceUrl: "https://www.gbif.org/occurrence/1",
        credit: "Ana",
        license: "CC BY 4.0",
      },
      {
        url: "https://example.com/three.jpg",
        sourceUrl: "https://www.gbif.org/occurrence/3",
        credit: null,
        license: null,
      },
    ]);
  });

  it("returns null when GBIF has no match", async () => {
    mockGbif({ "/species/match": { matchType: "NONE", confidence: 100 } });
    expect(await lookupSpecies("not a plant")).toBeNull();
  });

  it("still returns the match when photos and common names fail", async () => {
    mockGbif({ "/species/match": MATCH });
    const result = await lookupSpecies("Bougainvillea glabra");
    expect(result).toMatchObject({ commonNames: [], photos: [] });
  });

  it("looks photos up under the accepted name of a synonym", async () => {
    const fetchMock = mockGbif({
      "/species/match": { ...MATCH, usageKey: 5, speciesKey: 100, status: "SYNONYM" },
      "/occurrence/search": { results: [] },
      "/vernacularNames": { results: [] },
    });
    await lookupSpecies("Old name");
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toContainEqual(
      expect.stringContaining("taxonKey=100"),
    );
  });
});

describe("webSizedPhotoUrl", () => {
  it("only rewrites iNaturalist originals", () => {
    expect(webSizedPhotoUrl("https://static.inaturalist.org/photos/1/original.jpg")).toBe(
      "https://static.inaturalist.org/photos/1/medium.jpg",
    );
    expect(webSizedPhotoUrl("https://example.com/original.jpg")).toBe("https://example.com/original.jpg");
  });
});

describe("fetchImage", () => {
  it("returns base64 data for an image", async () => {
    vi.stubGlobal("fetch", async () => new Response("abc", { headers: { "content-type": "image/jpeg" } }));
    expect(await fetchImage("https://example.com/a.jpg")).toEqual({ data: "YWJj", mimeType: "image/jpeg" });
  });

  it("skips non-images, oversized images and failures", async () => {
    vi.stubGlobal("fetch", async () => new Response("<html>", { headers: { "content-type": "text/html" } }));
    expect(await fetchImage("https://example.com/a")).toBeNull();

    vi.stubGlobal(
      "fetch",
      async () =>
        new Response("x", { headers: { "content-type": "image/png", "content-length": "9999999" } }),
    );
    expect(await fetchImage("https://example.com/big.png")).toBeNull();

    vi.stubGlobal("fetch", async () => {
      throw new Error("offline");
    });
    expect(await fetchImage("https://example.com/a.jpg")).toBeNull();
  });
});
