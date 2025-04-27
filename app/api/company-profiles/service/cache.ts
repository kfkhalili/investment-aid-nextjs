import { ensureCollection } from "@/api/ensureCollection";
import { CompanyProfileDoc } from "./types";

/** Read-through cache.
 *  No “fresh” branch yet, but projection/limit stay here, not in route. */
export async function getCompanyProfiles(): Promise<CompanyProfileDoc[]> {
  const col = await ensureCollection<CompanyProfileDoc>("company_profiles");

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
