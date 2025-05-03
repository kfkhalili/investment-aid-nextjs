/* ──────────────────────────────────────────────────────────────────────
 * src/api/income-statements/service/config.ts
 * Configuration for the Income Statement service.
 * ---------------------------------------------------------------------*/
import { IndexSpecification } from "mongodb";
import { GenericServiceConfig, FetchMode } from "@/api/common";

// Import specific types and mappers for Income Statements
import {
  RawIncomeStatement,
  IncomeStatementDoc,
  IncomeStatement,
  mapRawIncomeStatementToDoc,
} from "./types";

// Import or define cache TTL
// Assuming a local constants file exists:
import { CACHE_TTL_MS, incomeStatementKeyOrder } from "./constants";
import { mapDocToPartialApi } from "@/api/common";

// --- Define specific configuration for the Income Statement service ---

/**
 * MongoDB index key definitions for the income_statement collection.
 * These definitions conform to the IndexSpecification type provided previously.
 * IMPORTANT: Options like 'unique' must be handled separately (e.g., within ensureCollection).
 */
const collectionIndexes: IndexSpecification[] = [
  // Key for unique compound index (uniqueness ensured elsewhere)
  { symbol: 1, date: -1 },
  // Key for index on symbol only
  { symbol: 1 },
  // Key for index on modifiedAt
  { modifiedAt: -1 },
];

/**
 * Configuration object passed to `createGenericService` to instantiate
 * the service for fetching and caching Income Statements.
 */
export const incomeStatementConfig: GenericServiceConfig<
  RawIncomeStatement,
  IncomeStatementDoc,
  IncomeStatement
> = {
  // --- Core Identification & Storage ---
  collectionName: "income_statements", // MongoDB collection name
  collectionIndexes: collectionIndexes, // Index key definitions (options handled elsewhere)

  // --- FMP API Fetching ---
  fetchMode: FetchMode.BySymbol, // Fetch data per symbol
  fmpBasePath: "v3", // FMP API version path
  fmpPath: "income-statement", // FMP specific endpoint path
  fmpParams: { period: "annual" }, // Static query parameters for FMP API (fetch annual data)

  // --- Caching ---
  cacheTtlMs: CACHE_TTL_MS, // How long data is considered fresh

  // --- Data Structure, Uniqueness & Mapping ---
  uniqueKeyFields: ["symbol", "date"], // Fields defining a unique DB record for upserts
  mapRawToDoc: mapRawIncomeStatementToDoc, // Function mapping FMP Raw -> DB structure
  mapDocToApi: mapDocToPartialApi, // Function mapping DB structure -> API response structure
  apiFieldOrder: incomeStatementKeyOrder, // Projection for the getAll() list view (optional)

  // --- Behavior Modifiers for 'bySymbol' mode ---
  isSingleRecordPerSymbol: false, // FMP returns multiple historical records per symbol
  sortByFieldForLatest: "date", // Use the 'date' field to determine the latest record for getOne/cache checks

  // --- Optional Callbacks ---
  // validateRawData: (data: unknown): data is RawIncomeStatement[] => { /* Add validation */ return true; },
  // processRawDataArray: (rawData: RawIncomeStatement[]) => { /* Add filtering */ return rawData; },
};
