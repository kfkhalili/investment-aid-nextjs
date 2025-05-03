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
import { profileKeyOrder } from "./constants";

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
  apiFieldOrder: profileKeyOrder,

  // --- Behavior Modifiers for 'bySymbol' mode ---
  isSingleRecordPerSymbol: true,
  // sortByFieldForLatest: undefined, // Not needed

  // --- Optional Callbacks ---
  // validateRawData: ...
  // processRawDataArray: ...
};
