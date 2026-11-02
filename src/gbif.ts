const GBIF_API = "https://api.gbif.org/v1";
const FETCH_TIMEOUT_MS = 8000;
// Keeps each photo well under the size an MCP client will pass on to the model.
const MAX_IMAGE_BYTES = 1_500_000;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export interface SpeciesMatch {
  usageKey: number;
  scientificName: string;
  canonicalName: string;
  rank: string;
  status: string;
  confidence: number;
  matchType: string;
  family?: string;
  genus?: string;
}

export interface ReferencePhoto {
  /** A web-sized copy of the photo. */
  url: string;
  /** The GBIF occurrence page the photo comes from. */
  sourceUrl: string;
  credit: string | null;
  license: string | null;
}

export interface SpeciesLookup {
  match: SpeciesMatch;
  commonNames: string[];
  alternatives: SpeciesMatch[];
  photos: ReferencePhoto[];
  /** Why photos or common names could not be fetched, if a GBIF request failed. */
  warnings: string[];
}

interface GbifMatch extends Partial<SpeciesMatch> {
  speciesKey?: number;
  acceptedUsageKey?: number;
  alternatives?: GbifMatch[];
}

interface GbifMedia {
  type?: string;
  format?: string;
  identifier?: string;
  license?: string;
  rightsHolder?: string;
  creator?: string;
}

async function gbifGet<T>(path: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<T> {
  const res = await fetch(`${GBIF_API}${path}`, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`GBIF request failed (${res.status}): ${path}`);
  return (await res.json()) as T;
}

function toMatch(m: GbifMatch): SpeciesMatch | null {
  if (!m.usageKey || !m.scientificName || m.matchType === "NONE") return null;
  return {
    usageKey: m.usageKey,
    scientificName: m.scientificName,
    canonicalName: m.canonicalName ?? m.scientificName,
    rank: m.rank ?? "UNKNOWN",
    status: m.status ?? "UNKNOWN",
    confidence: m.confidence ?? 0,
    matchType: m.matchType ?? "UNKNOWN",
    family: m.family,
    genus: m.genus,
  };
}

/** iNaturalist, the main photo source on GBIF, serves full-resolution originals; ask for its web size. */
export function webSizedPhotoUrl(url: string): string {
  if (!/inaturalist/i.test(url)) return url;
  return url.replace(/\/original(\.\w+)?$/, (_, ext: string | undefined) => `/medium${ext ?? ""}`);
}

async function fetchCommonNames(key: number): Promise<string[]> {
  const { results } = await gbifGet<{ results: { vernacularName: string; language?: string }[] }>(
    `/species/${key}/vernacularNames?limit=100`,
  );
  const names = results.filter((r) => r.language === "eng").map((r) => r.vernacularName.trim());
  // GBIF lists the same name from several checklists, often in different cases.
  const seen = new Set<string>();
  return names.filter((n) => !seen.has(n.toLowerCase()) && seen.add(n.toLowerCase())).slice(0, 5);
}

/** Occurrence searches over a whole taxon can be slow on GBIF, so they get a longer timeout. */
const OCCURRENCE_TIMEOUT_MS = 20000;

/** Photos from the species' own GBIF media (checklist images), used when no observation photos are found. */
async function fetchSpeciesMedia(taxonKey: number, limit: number): Promise<ReferencePhoto[]> {
  const { results } = await gbifGet<{ results: GbifMedia[] }>(
    `/species/${taxonKey}/media?limit=${limit * 3}`,
  );
  return results
    .filter((m) => m.identifier?.startsWith("http"))
    .slice(0, limit)
    .map((m) => ({
      url: webSizedPhotoUrl(m.identifier as string),
      sourceUrl: `https://www.gbif.org/species/${taxonKey}`,
      credit: m.rightsHolder ?? m.creator ?? null,
      license: m.license ?? null,
    }));
}

async function fetchPhotos(taxonKey: number, limit: number): Promise<ReferencePhoto[]> {
  const { results } = await gbifGet<{ results: { key: number; media?: GbifMedia[] }[] }>(
    `/occurrence/search?taxonKey=${taxonKey}&mediaType=StillImage&basisOfRecord=HUMAN_OBSERVATION&limit=${limit * 3}`,
    OCCURRENCE_TIMEOUT_MS,
  );
  const photos: ReferencePhoto[] = [];
  // One photo per observation, so the set shows different plants rather than one plant many times.
  for (const occurrence of results) {
    const media = occurrence.media?.find((m) => m.type === "StillImage" && m.identifier?.startsWith("http"));
    if (!media?.identifier) continue;
    photos.push({
      url: webSizedPhotoUrl(media.identifier),
      sourceUrl: `https://www.gbif.org/occurrence/${occurrence.key}`,
      credit: media.rightsHolder ?? media.creator ?? null,
      license: media.license ?? null,
    });
    if (photos.length >= limit) break;
  }
  return photos;
}

/**
 * Looks a plant name up in GBIF's backbone taxonomy, with its common names and photos of
 * the plant observed in the wild. Returns null when GBIF has no match for the name.
 */
export async function lookupSpecies(name: string, photoLimit = 4): Promise<SpeciesLookup | null> {
  const raw = await gbifGet<GbifMatch>(
    `/species/match?name=${encodeURIComponent(name)}&kingdom=Plantae&verbose=true`,
  );
  const match = toMatch(raw);
  if (!match) return null;

  // Synonyms resolve to their accepted name, which is where photos and common names live.
  const key = raw.speciesKey ?? raw.acceptedUsageKey ?? match.usageKey;
  const warnings: string[] = [];
  const soft =
    <T>(what: string, fallback: T) =>
    (e: unknown) => {
      const reason = e instanceof Error ? e.message : String(e);
      console.error(`GBIF ${what} failed for ${name}:`, reason);
      warnings.push(`${what} failed (${reason})`);
      return fallback;
    };
  const [commonNames, observed] = await Promise.all([
    fetchCommonNames(key).catch(soft<string[]>("common names", [])),
    photoLimit > 0
      ? fetchPhotos(key, photoLimit).catch(soft<ReferencePhoto[]>("observation photos", []))
      : [],
  ]);
  const photos =
    observed.length || photoLimit <= 0
      ? observed
      : await fetchSpeciesMedia(key, photoLimit).catch(soft<ReferencePhoto[]>("species media", []));
  const alternatives = (raw.alternatives ?? [])
    .map(toMatch)
    .filter((m): m is SpeciesMatch => m !== null && m.canonicalName !== match.canonicalName)
    .slice(0, 3);

  return { match, commonNames, alternatives, photos, warnings };
}

/** Downloads a photo for inline display, or null when it is unreachable, not an image, or too large. */
export async function fetchImage(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) return null;
    const mimeType = res.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "";
    if (!IMAGE_TYPES.has(mimeType)) return null;
    const length = Number(res.headers.get("content-length") ?? 0);
    if (length > MAX_IMAGE_BYTES) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.byteLength > MAX_IMAGE_BYTES) return null;
    return { data: bytes.toString("base64"), mimeType };
  } catch {
    return null;
  }
}
