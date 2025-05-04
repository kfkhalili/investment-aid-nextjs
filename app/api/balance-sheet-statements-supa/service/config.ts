/* ──────────────────────────────────────────────────────────────────────
 * src/api/balance-sheet-statements/service/config.ts (Supabase Version)
 * Configuration for the Balance Sheet Statement service using Supabase.
 * ---------------------------------------------------------------------*/
// Removed Mongo IndexSpecification import
import {
  GenericSupabaseServiceConfig, // Import Supabase config type
  FetchMode,
} from "@/api/common/supabase"; // Adjust path for common Supabase types
import { mapRowToPartialApi } from "@/api/common/supabase"; // Import common Supabase mapper
import { balanceSheetKeyOrder, CACHE_TTL_MS } from "./constants"; // Import constants (ensure balanceSheetKeyOrder uses snake_case)

// Import specific types and mappers for Balance Sheets (Supabase version)
import {
  RawBalanceSheetStatement,
  BalanceSheetStatementRow, // Use the Supabase Row type
  BalanceSheetStatement, // Use the conceptual API type
  mapRawBalanceSheetToRow, // Use the Raw -> Row mapper for Supabase
} from "./types";

// --- Define specific configuration for the Balance Sheet service ---

// collectionIndexes (MongoDB specific) is removed. Handled by DB migrations.

/**
 * Configuration object passed to `createGenericSupabaseService` to instantiate
 * the service for fetching and caching Balance Sheet Statements using Supabase.
 */
export const balanceSheetStatementConfig: GenericSupabaseServiceConfig<
  RawBalanceSheetStatement,
  BalanceSheetStatementRow, // Use Supabase Row type
  BalanceSheetStatement // Use Supabase API type
> = {
  // --- Core Identification & Storage ---
  tableName: "balance_sheet_statements", // Use Postgres table name

  // --- FMP API Fetching ---
  fetchMode: FetchMode.BySymbol, // Fetch data per symbol
  fmpBasePath: "v3", // FMP API version path
  fmpPath: "balance-sheet-statement", // FMP specific endpoint path
  fmpSymbolLocation: "path", // Explicitly state symbol goes in path for this endpoint
  fmpParams: { period: "annual" }, // Static query parameters for FMP API

  // --- Caching ---
  cacheTtlMs: CACHE_TTL_MS, // How long data is considered fresh

  // --- Data Structure, Uniqueness & Mapping ---
  // Columns defining the UNIQUE constraint used for Supabase upserts. Must match DB.
  uniqueKeyColumns: ["symbol", "date", "period"], // Correct composite key for statements
  mapRawToRow: mapRawBalanceSheetToRow, // Use Supabase-specific Raw -> Row mapper
  mapRowToApi: mapRowToPartialApi, // Use common Supabase Row -> API mapper
  apiFieldOrder: balanceSheetKeyOrder, // Use defined key order (snake_case)

  // --- Behavior Modifiers for 'bySymbol' mode ---
  isSingleRecordPerSymbol: false, // FMP returns multiple historical records
  // Use the 'date' column (which exists in BaseRow/BalanceSheetStatementRow)
  sortByFieldForLatest: "date",

  // --- Optional Callbacks ---
  // validateRawData: (data: unknown): data is RawBalanceSheetStatement | RawBalanceSheetStatement[] => {/*...*/ return true;},
  // processRawDataArray: (rawData: RawBalanceSheetStatement[]) => { /*...*/ return rawData; },
};
