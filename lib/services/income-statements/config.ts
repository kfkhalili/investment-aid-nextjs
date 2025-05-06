/* ──────────────────────────────────────────────────────────────────────
 * src/api/income-statements/service/config.ts (Supabase Version)
 * Configuration for the Income Statement service using Supabase.
 * ---------------------------------------------------------------------*/
// Removed Mongo IndexSpecification import
import {
  GenericSupabaseServiceConfig, // Import Supabase config type
  FetchMode,
} from "@/lib/common/supabase"; // Adjust path for common Supabase types
import { mapRowToPartialApi } from "@/lib/common/supabase"; // Import common Supabase mapper
import { incomeStatementKeyOrder, CACHE_TTL_MS } from "./constants"; // Import constants

// Import specific types and mappers for Income Statements (Supabase version)
import {
  RawIncomeStatement,
  IncomeStatementRow, // Use the Supabase Row type
  IncomeStatement, // Use the conceptual API type
  mapRawIncomeStatementToRow, // Use the Raw -> Row mapper for Supabase
} from "./types";

// --- Define specific configuration for the Income Statement service ---

// collectionIndexes (MongoDB specific) is removed. Handled by DB migrations.

/**
 * Configuration object passed to `createGenericSupabaseService` to instantiate
 * the service for fetching and caching Income Statements using Supabase.
 */
export const incomeStatementConfig: GenericSupabaseServiceConfig<
  RawIncomeStatement,
  IncomeStatementRow, // Use IncomeStatementRow from generated types
  IncomeStatement // Use IncomeStatement API type
> = {
  // --- Core Identification & Storage ---
  tableName: "income_statements", // Use Postgres table name

  // --- FMP API Fetching ---
  fetchMode: FetchMode.BySymbol, // Fetch data per symbol
  fmpBasePath: "v3", // FMP API version path
  fmpPath: "income-statement", // FMP specific endpoint path
  fmpSymbolLocation: "path", // Explicitly state symbol goes in path
  fmpParams: { period: "annual" }, // Static query parameters for FMP API

  // --- Caching ---
  cacheTtlMs: CACHE_TTL_MS, // How long data is considered fresh

  // --- Data Structure, Uniqueness & Mapping ---
  // Columns defining the UNIQUE constraint used for upserts. Must match DB.
  uniqueKeyColumns: ["symbol", "date", "period"], // Matches UNIQUE(symbol, date, period)
  mapRawToRow: mapRawIncomeStatementToRow, // Use Supabase-specific Raw -> Row mapper
  mapRowToApi: mapRowToPartialApi, // Use common Supabase Row -> API mapper
  apiFieldOrder: incomeStatementKeyOrder, // Use defined key order for selection/ordering

  // --- Behavior Modifiers for 'bySymbol' mode ---
  isSingleRecordPerSymbol: false, // FMP returns multiple historical records per symbol
  // Use the 'date' column (snake_case) to determine the latest record
  sortByFieldForLatest: "date",

  // --- Optional Callbacks ---
  // validateRawData: (data: unknown): data is RawIncomeStatement | RawIncomeStatement[] => {/*...*/ return true;},
  // processRawDataArray: (rawData: RawIncomeStatement[]) => { /*...*/ return rawData; },
};
