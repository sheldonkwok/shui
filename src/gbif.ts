const GBIF_API = "https://api.gbif.org/v1";
const FETCH_TIMEOUT_MS = 8000;

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

export interface SpeciesLookup {
  match: SpeciesMatch;
  commonNames: string[];
  alternatives: SpeciesMatch[];
}

interface GbifMatch extends Partial<SpeciesMatch> {
  speciesKey?: number;
  acceptedUsageKey?: number;
  alternatives?: GbifMatch[];
}

const USER_AGENT = "shui-plant-tracker";
const MAX_ATTEMPTS = 3;
const RETRY_MAX_DELAY_MS = 2000;

/** GBIF rate limits shared hosting IPs (429); a short pause and retry usually gets through. */
async function gbifGet<T>(path: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`${GBIF_API}${path}`, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.ok) return (await res.json()) as T;
    if ((res.status === 429 || res.status === 503) && attempt < MAX_ATTEMPTS) {
      const retryAfter = Number(res.headers.get("retry-after")) * 1000;
      const delay = Math.min(retryAfter > 0 ? retryAfter : 500 * attempt, RETRY_MAX_DELAY_MS);
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }
    throw new Error(`GBIF request failed (${res.status}): ${path}`);
  }
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

async function fetchCommonNames(key: number): Promise<string[]> {
  const { results } = await gbifGet<{ results: { vernacularName: string; language?: string }[] }>(
    `/species/${key}/vernacularNames?limit=100`,
  );
  const names = results.filter((r) => r.language === "eng").map((r) => r.vernacularName.trim());
  // GBIF lists the same name from several checklists, often in different cases.
  const seen = new Set<string>();
  return names.filter((n) => !seen.has(n.toLowerCase()) && seen.add(n.toLowerCase())).slice(0, 5);
}

/**
 * Looks a plant name up in GBIF's backbone taxonomy, with its common names. Returns null when GBIF has no match for the name.
 */
export async function lookupSpecies(name: string): Promise<SpeciesLookup | null> {
  const raw = await gbifGet<GbifMatch>(
    `/species/match?name=${encodeURIComponent(name)}&kingdom=Plantae&verbose=true`,
  );
  const match = toMatch(raw);
  if (!match) return null;

  // Synonyms resolve to their accepted name, which is where common names live.
  const key = raw.speciesKey ?? raw.acceptedUsageKey ?? match.usageKey;
  const commonNames = await fetchCommonNames(key).catch((e: unknown) => {
    console.error(`GBIF common names failed for ${name}:`, e instanceof Error ? e.message : e);
    return [];
  });
  const alternatives = (raw.alternatives ?? [])
    .map(toMatch)
    .filter((m): m is SpeciesMatch => m !== null && m.canonicalName !== match.canonicalName)
    .slice(0, 3);

  return { match, commonNames, alternatives };
}
