import { Profile } from "./types";

/** how long we trust a snapshot (1 week) */
export const CACHE_TTL_MS = 60 * 24 * 7 * 60 * 1_000;

// Define desired API response key order
export const profileKeyOrder: ReadonlyArray<keyof Profile> = [
  "image",
  "symbol",
  "price",
  "marketCap",
  "beta",
  "lastDividend",
  "range",
  "change",
  "changePercentage",
  "volume",
  "averageVolume",
  "companyName",
  "currency",
  "cik",
  "isin",
  "cusip",
  "exchangeFullName",
  "exchange",
  "industry",
  "website",
  "description",
  "ceo",
  "sector",
  "country",
  "fullTimeEmployees",
  "phone",
  "address",
  "city",
  "state",
  "zip",
  "ipoDate",
  "defaultImage",
  "isEtf",
  "isActivelyTrading",
  "isAdr",
  "isFund",
];
