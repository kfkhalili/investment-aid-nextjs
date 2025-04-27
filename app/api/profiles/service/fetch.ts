// app/api/profiles/service/fetch.ts
import { ensureCollection } from "@/api/ensureCollection";
import { ProfileDoc, Profile, mapProfileDocToProfile } from "./types";

interface RawProfile {
  symbol: string;
  price: number;
  marketCap: number;
  beta: number;
  lastDividend: number;
  range: string;
  change: number;
  changePercentage: number;
  volume: number;
  averageVolume: number;
  companyName: string;
  currency: string;
  cik: string;
  isin: string;
  cusip: string;
  exchangeFullName: string;
  exchange: string;
  industry: string;
  website: string;
  description: string;
  ceo: string;
  sector: string;
  country: string;
  fullTimeEmployees: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  image: string;
  ipoDate: string;
  defaultImage: boolean;
  isEtf: boolean;
  isActivelyTrading: boolean;
  isAdr: boolean;
  isFund: boolean;
}

const URL = (s: string) =>
  `https://financialmodelingprep.com/stable/profile?symbol=${s}&apikey=${process
    .env.FMP_API_KEY!}`;

export async function fetchAndUpsertProfile(symbol: string): Promise<Profile> {
  const res = await fetch(URL(symbol), { cache: "no-store" });
  if (!res.ok) throw new Error(`FMP company-profile failed ${res.status}`);

  const [raw] = (await res.json()) as RawProfile[];
  if (!raw) throw new Error(`profile not found for ${symbol}`);

  /* build replacement – NO _id, Mongo will add it */
  const replacement: Omit<ProfileDoc, "_id"> = {
    symbol: raw.symbol,
    price: raw.price,
    marketCap: raw.marketCap,
    beta: raw.beta,
    lastDividend: raw.lastDividend,
    range: raw.range,
    change: raw.change,
    changePercentage: raw.changePercentage,
    volume: raw.volume,
    averageVolume: raw.averageVolume,
    companyName: raw.companyName,
    currency: raw.currency,
    cik: raw.cik,
    isin: raw.isin,
    cusip: raw.cusip,
    exchangeFullName: raw.exchangeFullName,
    exchange: raw.exchange,
    industry: raw.industry,
    website: raw.website,
    description: raw.description,
    ceo: raw.ceo,
    sector: raw.sector,
    country: raw.country,
    fullTimeEmployees: Number(raw.fullTimeEmployees),
    phone: raw.phone,
    address: raw.address,
    city: raw.city,
    state: raw.state ?? "",
    zip: raw.zip,
    image: raw.image,
    ipoDate: raw.ipoDate,
    defaultImage: raw.defaultImage,
    isEtf: raw.isEtf,
    isActivelyTraded: raw.isActivelyTrading, // ← name fixed
    isAdr: raw.isAdr,
    isFund: raw.isFund,
    modifiedAt: new Date(),
  };

  /* upsert */
  const col = await ensureCollection<ProfileDoc>("profiles", {
    symbol: 1,
  });

  await col.updateOne(
    { symbol: replacement.symbol },
    { $set: replacement, $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  );

  /* read the canonical stored version (with real _id) */
  const stored = (await col.findOne({ symbol: replacement.symbol }))!;
  return mapProfileDocToProfile(stored);
}
