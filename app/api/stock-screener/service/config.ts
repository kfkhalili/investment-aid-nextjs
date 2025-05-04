/* ──────────────────────────────────────────────────────────────────────
 * src/api/stock-screener/service/config.ts (Supabase Version)
 * Configuration for the Stock Screener service using Supabase.
 * ---------------------------------------------------------------------*/
import { GenericSupabaseServiceConfig, FetchMode } from "@/api/common/supabase";
import { mapRowToPartialApi } from "@/api/common/supabase";
import { stockScreenerKeyOrder, CACHE_TTL_MS } from "./constants";

// Import specific types and mappers for Stock Screener (Supabase version)
import {
  RawStockScreenerItem,
  StockScreenerRow,
  StockScreenerItem,
  mapRawStockScreenerToRow,
} from "./types";

/**
 * Configuration object passed to `createGenericSupabaseService` to instantiate
 * the service for fetching and caching Stock Screener results using Supabase.
 */
export const stockScreenerConfig: GenericSupabaseServiceConfig<
  RawStockScreenerItem,
  StockScreenerRow,
  StockScreenerItem
> = {
  // --- Core Identification & Storage ---
  tableName: "stock_screener", // Use Postgres table name

  // --- FMP API Fetching ---
  fetchMode: FetchMode.FullCollection, // Screener fetches the whole list
  fmpBasePath: "v3", // Standard v3 path
  fmpPath: "stock-screener", // FMP specific endpoint path
  // fmpSymbolLocation: not needed for FullCollection mode
  fmpParams: { limit: 10000, isActivelyTrading: true }, // Parameters for the screener API

  // --- Caching ---
  cacheTtlMs: CACHE_TTL_MS,

  // --- Data Structure, Uniqueness & Mapping ---
  // Column defining the UNIQUE constraint used for upserts (symbol is unique in snapshot)
  uniqueKeyColumns: ["symbol"],
  mapRawToRow: mapRawStockScreenerToRow, // Use screener-specific Raw -> Row mapper
  mapRowToApi: mapRowToPartialApi, // Use common Supabase Row -> API mapper
  apiFieldOrder: stockScreenerKeyOrder, // Use defined key order for selection/ordering

  // --- Behavior Modifiers (Not typically needed for FullCollection mode) ---
  // isSingleRecordPerSymbol: undefined,
  // sortByFieldForLatest: undefined,

  // --- Optional Callbacks ---
  // validateRawData: (data: unknown): data is RawStockScreenerItem[] => { /*...*/ return true; },
  // processRawDataArray: (rawData: RawStockScreenerItem[]) => { /*...*/ return rawData; },
};
