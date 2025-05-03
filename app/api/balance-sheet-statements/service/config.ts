/* ──────────────────────────────────────────────────────────────────────
 * src/api/balance-sheet-statement/service/config.ts
 * Configuration for the Balance Sheet Statement service.
 * ---------------------------------------------------------------------*/
import { IndexSpecification } from "mongodb"; // Use the type from your mongodb.d.ts
import { GenericServiceConfig, FetchMode } from "@/api/common"; // Import common types

// Import specific types and mappers for Balance Sheets
import {
  RawBalanceSheetStatement,
  BalanceSheetStatementDoc,
  BalanceSheetStatement,
  mapRawBalanceSheetToDoc,
} from "./types";

// Import or define cache TTL
import { balanceSheetKeyOrder, CACHE_TTL_MS } from "./constants";
import { mapDocToPartialApi } from "@/api/common";

// --- Define specific configuration for the Balance Sheet service ---
/**
 * MongoDB index key definitions for the balance_sheet_statement collection.
 * These definitions conform to the IndexSpecification type provided.
 */
const collectionIndexes: IndexSpecification[] = [
  // Provide only the key definitions matching the type
  { symbol: 1, date: -1 }, // Key for unique compound index (uniqueness ensured elsewhere)
  { symbol: 1 }, // Key for index on symbol only
  { modifiedAt: -1 }, // Key for index on modifiedAt
];

/**
 * Configuration object passed to `createGenericService` to instantiate
 * the service for fetching and caching Balance Sheet Statements.
 */
export const balanceSheetStatementConfig: GenericServiceConfig<
  RawBalanceSheetStatement,
  BalanceSheetStatementDoc,
  BalanceSheetStatement
> = {
  // --- Core Identification & Storage ---
  collectionName: "balance_sheet_statement", // MongoDB collection name
  collectionIndexes: collectionIndexes, // Index key definitions (options handled elsewhere)

  // --- FMP API Fetching ---
  fetchMode: FetchMode.BySymbol, // Fetch data per symbol
  fmpBasePath: "v3", // FMP API version path
  fmpPath: "balance-sheet-statement", // FMP specific endpoint path
  fmpParams: { period: "annual" }, // Static query parameters for FMP API (fetch annual data)

  // --- Caching ---
  cacheTtlMs: CACHE_TTL_MS, // How long data is considered fresh (e.g., 1 week)

  // --- Data Structure, Uniqueness & Mapping ---
  uniqueKeyFields: ["symbol", "date"], // Fields defining a unique DB record for upserts
  mapRawToDoc: mapRawBalanceSheetToDoc, // Function mapping FMP Raw -> DB structure
  mapDocToApi: mapDocToPartialApi, // Function mapping DB structure -> API response structure
  apiFieldOrder: balanceSheetKeyOrder,

  // --- Behavior Modifiers for 'bySymbol' mode ---
  isSingleRecordPerSymbol: false, // FMP returns multiple historical records per symbol
  sortByFieldForLatest: "date", // Use the 'date' field to determine the latest record for getOne/cache checks

  // --- Optional Callbacks ---
  // validateRawData: (data: unknown): data is RawBalanceSheetStatement[] => { /* Add validation */ return true; },
  // processRawDataArray: (rawData: RawBalanceSheetStatement[]) => { /* Add filtering */ return rawData; },
};
