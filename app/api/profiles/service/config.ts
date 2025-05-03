/* ──────────────────────────────────────────────────────────────────────
 * src/api/profile/service/config.ts
 * Configuration for the Company Profile service.
 * ---------------------------------------------------------------------*/
import { IndexSpecification } from "mongodb";
import {
  GenericServiceConfig,
  FetchMode,
  mapDocToPartialApi,
} from "@/api/common"; // Import common types & mapper

// Import specific types and mappers for Profiles
import {
  RawProfile,
  ProfileDoc,
  Profile,
  mapRawProfileToDoc, // Correct raw->doc mapper
} from "./types";

// Import or define cache TTL
import { CACHE_TTL_MS } from "./constants"; // Assuming constants.ts exists here

// --- Define specific configuration for the Profile service ---

/**
 * MongoDB index key definitions for the 'profiles' collection.
 */
const collectionIndexes: IndexSpecification[] = [
  { symbol: 1 },
  { modifiedAt: -1 },
];

/**
 * Projection for the `getAll()` list view.
 * This version explicitly includes ALL fields from ProfileDoc.
 */
const listProjection: { [K in keyof ProfileDoc]?: 1 } = {
  // --- BaseDoc fields first for convention ---
  _id: 1,
  symbol: 1, // Matches FMP order start
  modifiedAt: 1, // Standard BaseDoc field

  // --- Fields in FMP API Order ---
  price: 1,
  marketCap: 1,
  beta: 1,
  lastDividend: 1,
  range: 1,
  change: 1,
  changePercentage: 1,
  volume: 1,
  averageVolume: 1, // Assuming this name matches your ProfileDoc
  companyName: 1,
  currency: 1,
  cik: 1,
  isin: 1,
  cusip: 1,
  exchangeFullName: 1,
  exchange: 1,
  industry: 1,
  website: 1,
  description: 1,
  ceo: 1,
  sector: 1,
  country: 1,
  fullTimeEmployees: 1, // Stored as number in ProfileDoc
  phone: 1,
  address: 1,
  city: 1,
  state: 1,
  zip: 1,
  image: 1,
  ipoDate: 1,
  defaultImage: 1,
  isEtf: 1,
  isActivelyTrading: 1,
  isAdr: 1,
  isFund: 1,
};

/**
 * Configuration object passed to `createGenericService` to instantiate
 * the service for fetching and caching Company Profiles.
 */
export const profileConfig: GenericServiceConfig<
  RawProfile,
  ProfileDoc,
  Profile
> = {
  // --- Core Identification & Storage ---
  collectionName: "profiles",
  collectionIndexes: collectionIndexes,

  // --- FMP API Fetching ---
  fetchMode: FetchMode.BySymbol,
  fmpBasePath: "v3",
  fmpPath: "profile",
  fmpParams: {},

  // --- Caching ---
  cacheTtlMs: CACHE_TTL_MS,

  // --- Data Structure, Uniqueness & Mapping ---
  uniqueKeyFields: ["symbol"],
  mapRawToDoc: mapRawProfileToDoc,
  mapDocToApi: mapDocToPartialApi,
  listProjection: listProjection, // Use the projection including all fields

  // --- Behavior Modifiers for 'bySymbol' mode ---
  isSingleRecordPerSymbol: true,
  // sortByFieldForLatest: undefined, // Not needed

  // --- Optional Callbacks ---
  // validateRawData: ...
  // processRawDataArray: ...
};
