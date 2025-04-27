import { ensureCollection } from "@/api/ensureCollection";
import { CACHE_TTL_MS } from "./constants";
import { ProfileDoc, Profile, mapProfileDocToProfile } from "./types";
import { fetchAndUpsertProfile } from "./fetch";

/** Read-through cache.
 *  No “fresh” branch yet, but projection/limit stay here, not in route. */
export async function getProfiles(): Promise<ProfileDoc[]> {
  const col = await ensureCollection<ProfileDoc>("profiles");

  return col
    .find(
      {},
      {
        projection: {
          symbol: 1,
          image: 1,
          companyName: 1,
          sector: 1,
          industry: 1,
          country: 1,
          marketCap: 1,
          price: 1,
          change: 1,
          volume: 1,
        },
      }
    )
    .limit(1_000)
    .toArray();
}

/**
 * Read-through cache for a single symbol.
 * Returns a Company (UI shape), pulling fresh data when stale / missing.
 */
export async function getProfile(symbol: string): Promise<Profile> {
  const col = await ensureCollection<ProfileDoc>("profiles", {
    symbol: 1,
  });

  const doc = await col.findOne({ symbol });

  const freshEnough =
    doc && Date.now() - doc.modifiedAt.getTime() < CACHE_TTL_MS;

  if (freshEnough) return mapProfileDocToProfile(doc);

  return fetchAndUpsertProfile(symbol);
}
