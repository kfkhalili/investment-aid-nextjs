/* ──────────────────────────────────────────────────────────────────────
 * src/api/profile/service/config.ts (Supabase Version)
 * Configuration for the Company Profile service using Supabase.
 * ---------------------------------------------------------------------*/
import {
  GenericSupabaseServiceConfig, // Import Supabase config type
  FetchMode,
} from "@/lib/common/supabase"; // Adjust path for common Supabase types
import { mapRowToPartialApi } from "@/lib/common/supabase"; // Import common Supabase mapper
import { profileKeyOrder, CACHE_TTL_MS } from "./constants"; // Import constants

// Import specific types and mappers for Profiles (Supabase version)
import {
  RawProfile,
  ProfileRow, // Use the Supabase Row type
  Profile, // Use the conceptual API type
  mapRawProfileToRow, // Use the Raw -> Row mapper for Supabase
} from "./types";

// --- Define specific configuration for the Profile service ---

// MongoDB Indexes are removed - DB schema/migrations handle Postgres indexes.

/**
 * Configuration object passed to `createGenericSupabaseService` to instantiate
 * the service for fetching and caching Company Profiles using Supabase.
 */
export const profileConfig: GenericSupabaseServiceConfig<
  RawProfile,
  ProfileRow, // Use ProfileRow (from generated types)
  Profile // Use Profile API type
> = {
  // --- Core Identification & Storage ---
  tableName: "profiles", // Use Postgres table name

  // --- FMP API Fetching ---
  fetchMode: FetchMode.BySymbol,
  fmpBasePath: "stable",
  fmpPath: "profile",
  fmpSymbolLocation: "param",
  fmpParams: {},

  // --- Caching ---
  cacheTtlMs: CACHE_TTL_MS,

  // --- Data Structure, Uniqueness & Mapping ---
  uniqueKeyColumns: ["symbol"],
  mapRawToRow: mapRawProfileToRow,
  mapRowToApi: mapRowToPartialApi, // Uses common Supabase mapper
  apiFieldOrder: profileKeyOrder,

  // --- Behavior Modifiers for 'bySymbol' mode ---
  isSingleRecordPerSymbol: true,
  // sortByFieldForLatest: undefined, // Not needed

  // --- Optional Callbacks ---
  // validateRawData: ...
  // processRawDataArray: ...
};
