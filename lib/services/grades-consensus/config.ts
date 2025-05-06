/* ──────────────────────────────────────────────────────────────────────
 * src/api/grades-consensus/service/config.ts (Supabase Version)
 * Configuration for the Grades Consensus service using Supabase.
 * ---------------------------------------------------------------------*/
import {
  GenericSupabaseServiceConfig,
  FetchMode,
  mapRowToPartialApi,
} from "@/lib/common/supabase";
import { gradesConsensusKeyOrder, CACHE_TTL_MS } from "./constants";

// Import specific types and mappers (Supabase version)
import {
  RawGradesConsensus,
  GradesConsensusRow, // Now extends BaseRow due to DDL changes
  GradesConsensusApiItem,
  mapRawGradesConsensusToRow,
} from "./types";

/**
 * Configuration object passed to `createGenericSupabaseService`.
 */
export const gradesConsensusConfig: GenericSupabaseServiceConfig<
  RawGradesConsensus,
  GradesConsensusRow, // Should now extend BaseRow
  GradesConsensusApiItem
> = {
  // --- Core Identification & Storage ---
  tableName: "grades_consensus",

  // --- FMP API Fetching ---
  fetchMode: FetchMode.BySymbol, // Fetched per symbol
  fmpBasePath: "stable", // Uses stable path
  fmpPath: "grades-consensus", // Endpoint path
  fmpSymbolLocation: "param", // Symbol is query parameter
  fmpParams: {}, // No extra static params

  // --- Caching ---
  cacheTtlMs: CACHE_TTL_MS,

  // --- Data Structure, Uniqueness & Mapping ---
  // Unique constraint for upsert (symbol + date for daily snapshot)
  uniqueKeyColumns: ["symbol", "date"], // UPDATED
  mapRawToRow: mapRawGradesConsensusToRow,
  mapRowToApi: mapRowToPartialApi, // Use common mapper
  apiFieldOrder: gradesConsensusKeyOrder,

  // --- Behavior Modifiers ---
  // Although FMP returns one object, we store daily snapshots, so multiple records per symbol exist.
  isSingleRecordPerSymbol: false, // UPDATED - We store history now
  sortByFieldForLatest: "date", // UPDATED - Use 'date' to find the latest snapshot

  // --- Optional Callbacks ---
  // Extract the single object from the array FMP returns
  processRawDataArray: (rawData: RawGradesConsensus[]) => {
    if (rawData && rawData.length > 0) {
      return [rawData[0]]; // Return array containing just the first object
    }
    return []; // Return empty if FMP response was empty/malformed
  },
  // validateRawData: ... // Optional: Add validation if needed
};
