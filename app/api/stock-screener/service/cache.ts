import { ensureCollection } from "@/api/ensureCollection";
import { CACHE_TTL_MS } from "./constants";
import { fetchAndUpsertStock } from "./fetch";
import { StockScreenerDoc } from "./types";

export async function getStockScreener(): Promise<StockScreenerDoc[]> {
  const col = await ensureCollection<StockScreenerDoc>("stock_screener", {
    modifiedAt: 1,
  });
  const latest = await col.find().sort({ modifiedAt: -1 }).limit(1).next();
  const stale =
    !latest || Date.now() - latest.modifiedAt.getTime() > CACHE_TTL_MS;

  if (stale) {
    try {
      return await fetchAndUpsertStock();
    } catch (e) {
      console.error("Stock-screener refresh failed", e);
    }
  }
  return col.find().toArray();
}
