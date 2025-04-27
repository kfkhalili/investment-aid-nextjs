import { ensureCollection } from "@/api/ensureCollection";
import { StockScreenerDoc } from "./types";

interface StockScreenerRow {
  symbol: string;
  companyName: string;
  marketCap: number | string;
  sector: string;
  industry: string;
  price: number | string;
  volume: number | string;
  country: string;
  exchange?: string;
  exchangeShortName?: string;
  beta?: number | string;
  isActivelyTrading: boolean;
}

const URL =
  "https://financialmodelingprep.com/api/v3/stock-screener?limit=10000&isActivelyTrading=true&apikey=" +
  process.env.FMP_API_KEY!;

export async function fetchAndUpsertStock(): Promise<StockScreenerDoc[]> {
  const res = await fetch(URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`FMP stock-screener failed ${res.status}`);

  const raw: StockScreenerRow[] = (await res.json()) as StockScreenerRow[];

  const replacements = raw.map((r) => ({
    symbol: r.symbol,
    companyName: r.companyName,
    marketCap: Number(r.marketCap),
    sector: r.sector,
    industry: r.industry,
    price: Number(r.price),
    volume: Number(r.volume),
    country: r.country,
    exchange: r.exchangeShortName ?? r.exchange ?? "N/A",
    beta: Number(r.beta ?? 0),
    isActivelyTrading: r.isActivelyTrading,
    modifiedAt: new Date(),
  }));

  const col = await ensureCollection<StockScreenerDoc>("stock_screener", {
    modifiedAt: 1,
  });
  const bulk = col.initializeUnorderedBulkOp();
  replacements.forEach((doc) =>
    bulk.find({ symbol: doc.symbol }).upsert().replaceOne(doc)
  );
  await bulk.execute();

  /* read back with fresh ObjectIds */
  return col.find().toArray();
}
