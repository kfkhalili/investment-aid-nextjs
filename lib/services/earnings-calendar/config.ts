/* ──────────────────────────────────────────────────────────────────────
 * src/api/earnings-calendar/service/config.ts (Supabase Version)
 * Configuration for the Earnings Calendar service using Supabase.
 * ---------------------------------------------------------------------*/
import { GenericSupabaseServiceConfig, FetchMode } from "@/lib/common/supabase"; // Adjusted path
import { mapRowToPartialApi } from "@/lib/common/supabase"; // Adjusted path
import { earningsCalendarKeyOrder, CACHE_TTL_MS } from "./constants";

// Import specific types and mappers (Supabase version)
import {
  RawEarningsCalendarItem,
  EarningsCalendarRow,
  EarningsCalendarApiItem,
  mapRawEarningsCalendarToRow,
} from "./types";

/**
 * Configuration object passed to `createGenericSupabaseService`.
 */
export const earningsCalendarConfig: GenericSupabaseServiceConfig<
  RawEarningsCalendarItem,
  EarningsCalendarRow,
  EarningsCalendarApiItem
> = {
  // --- Core Identification & Storage ---
  tableName: "earnings_calendar",

  // --- FMP API Fetching ---
  fetchMode: FetchMode.FullCollection, // Fetches the entire calendar snapshot
  fmpBasePath: "stable", // Uses stable path
  fmpPath: "earnings-calendar", // Endpoint path
  // fmpSymbolLocation: not needed for FullCollection
  fmpParams: {}, // No extra static params usually needed

  // --- Caching ---
  cacheTtlMs: CACHE_TTL_MS,

  // --- Data Structure, Uniqueness & Mapping ---
  // Unique constraint for upsert (symbol + date for daily event)
  uniqueKeyColumns: ["symbol", "date"],
  mapRawToRow: mapRawEarningsCalendarToRow,
  mapRowToApi: mapRowToPartialApi, // Use common mapper
  apiFieldOrder: earningsCalendarKeyOrder,

  // --- Behavior Modifiers ---
  // Not directly applicable for FullCollection cache checks in the same way
  // isSingleRecordPerSymbol: undefined,
  // sortByFieldForLatest: undefined,

  // --- Optional Callbacks ---
  // validateRawData: (data: unknown): data is RawEarningsCalendarItem[] => {/*...*/ return true;},
  // processRawDataArray: (rawData: RawEarningsCalendarItem[]) => { /*...*/ return rawData; },
};
