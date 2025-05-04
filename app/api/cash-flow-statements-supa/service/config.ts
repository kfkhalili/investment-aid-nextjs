/* ──────────────────────────────────────────────────────────────────────
 * src/api/cash-flow-statements/service/config.ts (Supabase Version)
 * Configuration for the Cash Flow Statement service using Supabase.
 * ---------------------------------------------------------------------*/
// Removed Mongo IndexSpecification import
import {
  GenericSupabaseServiceConfig, // Import Supabase config type
  FetchMode,
} from "@/api/common/supabase"; // Adjust path for common Supabase types
import { mapRowToPartialApi } from "@/api/common/supabase"; // Import common Supabase mapper
import { cashFlowKeyOrder, CACHE_TTL_MS } from "./constants"; // Import constants (ensure cashFlowKeyOrder uses snake_case)

// Import specific types and mappers for Cash Flow Statements (Supabase version)
import {
  RawCashFlowStatement,
  CashFlowStatementRow, // Use the Supabase Row type
  CashFlowStatement, // Use the conceptual API type
  mapRawCashFlowStatementToRow, // Use the Raw -> Row mapper for Supabase
} from "./types";

// --- Define specific configuration for the Cash Flow Statement service ---

// collectionIndexes (MongoDB specific) is removed. Handled by DB migrations.

/**
 * Configuration object passed to `createGenericSupabaseService` to instantiate
 * the service for fetching and caching Cash Flow Statements using Supabase.
 */
export const cashFlowStatementConfig: GenericSupabaseServiceConfig<
  RawCashFlowStatement,
  CashFlowStatementRow, // Use Supabase Row type
  CashFlowStatement // Use Supabase API type
> = {
  // --- Core Identification & Storage ---
  tableName: "cash_flow_statements", // Use Postgres table name

  // --- FMP API Fetching ---
  fetchMode: FetchMode.BySymbol, // Fetch data per symbol
  fmpBasePath: "v3", // FMP API version path
  fmpPath: "cash-flow-statement", // FMP specific endpoint path
  fmpSymbolLocation: "path", // Explicitly state symbol goes in path for this endpoint
  fmpParams: { period: "annual" }, // Static query parameters for FMP API (fetch annual data)

  // --- Caching ---
  cacheTtlMs: CACHE_TTL_MS, // How long data is considered fresh

  // --- Data Structure, Uniqueness & Mapping ---
  // Columns defining the UNIQUE constraint used for Supabase upserts. Must match DB constraint.
  uniqueKeyColumns: ["symbol", "date", "period"], // Correct composite key for statements
  mapRawToRow: mapRawCashFlowStatementToRow, // Use Supabase-specific Raw -> Row mapper
  mapRowToApi: mapRowToPartialApi, // Use common Supabase Row -> API mapper
  apiFieldOrder: cashFlowKeyOrder, // Use defined key order (snake_case) from constants

  // --- Behavior Modifiers for 'bySymbol' mode ---
  isSingleRecordPerSymbol: false, // FMP returns multiple historical records
  // Use the 'date' column (exists in CashFlowStatementRow) to find the latest
  sortByFieldForLatest: "date",

  // --- Optional Callbacks ---
  // validateRawData: (data: unknown): data is RawCashFlowStatement | RawCashFlowStatement[] => {/*...*/ return true;},
  // processRawDataArray: (rawData: RawCashFlowStatement[]) => { /*...*/ return rawData; },
};
