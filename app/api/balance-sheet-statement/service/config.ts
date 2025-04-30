/* ──────────────────────────────────────────────────────────────────────
 * src/api/balance-sheet-statement/service/config.ts
 * Configuration for the Balance Sheet Statement service.
 * ---------------------------------------------------------------------*/
import { IndexSpecification } from "mongodb"; // Use the type from your mongodb.d.ts
import { GenericServiceConfig, FetchMode } from "@/api/common/"; // Import common types

// Import specific types and mappers for Balance Sheets
import {
  RawBalanceSheetStatement,
  BalanceSheetStatementDoc,
  BalanceSheetStatement,
  mapRawBalanceSheetToDoc,
  mapBalanceSheetDocToApi,
} from "./types";

// Import or define cache TTL
import { CACHE_TTL_MS } from "./constants";

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
 * Optional: Define a projection for the `getAll()` list view if desired.
 * This selects specific fields when fetching the list of all balance sheets
 * across different symbols (when using fetchMode='bySymbol').
 * Ensure this includes all fields required by `mapBalanceSheetDocToApi` for it to function correctly.
 */
const listProjection: { [K in keyof BalanceSheetStatementDoc]?: 1 } = {
  _id: 1, // Needed by mapBalanceSheetDocToApi to create string _id
  symbol: 1,
  modifiedAt: 1, // Included as part of the Doc type, though often omitted in API responses
  date: 1,
  reportedCurrency: 1,
  cik: 1,
  fillingDate: 1,
  acceptedDate: 1,
  calendarYear: 1,
  period: 1,
  cashAndCashEquivalents: 1,
  shortTermInvestments: 1,
  cashAndShortTermInvestments: 1,
  netReceivables: 1,
  inventory: 1,
  otherCurrentAssets: 1,
  totalCurrentAssets: 1,
  propertyPlantEquipmentNet: 1,
  goodwill: 1,
  intangibleAssets: 1,
  goodwillAndIntangibleAssets: 1,
  longTermInvestments: 1,
  taxAssets: 1,
  otherNonCurrentAssets: 1,
  totalNonCurrentAssets: 1,
  otherAssets: 1,
  totalAssets: 1,
  accountPayables: 1,
  shortTermDebt: 1,
  taxPayables: 1,
  deferredRevenue: 1,
  otherCurrentLiabilities: 1,
  totalCurrentLiabilities: 1,
  longTermDebt: 1,
  deferredRevenueNonCurrent: 1,
  deferredTaxLiabilitiesNonCurrent: 1,
  otherNonCurrentLiabilities: 1,
  totalNonCurrentLiabilities: 1,
  otherLiabilities: 1,
  capitalLeaseObligations: 1, // Include optional fields as well
  totalLiabilities: 1,
  preferredStock: 1,
  commonStock: 1,
  retainedEarnings: 1,
  accumulatedOtherComprehensiveIncomeLoss: 1,
  othertotalStockholdersEquity: 1,
  totalStockholdersEquity: 1,
  totalEquity: 1,
  totalLiabilitiesAndStockholdersEquity: 1,
  minorityInterest: 1,
  totalLiabilitiesAndTotalEquity: 1,
  totalInvestments: 1,
  totalDebt: 1,
  netDebt: 1,
  link: 1,
  finalLink: 1,
};

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
  mapDocToApi: mapBalanceSheetDocToApi, // Function mapping DB structure -> API response structure
  listProjection: listProjection, // Projection for the getAll() list view (optional)

  // --- Behavior Modifiers for 'bySymbol' mode ---
  isSingleRecordPerSymbol: false, // FMP returns multiple historical records per symbol
  sortByFieldForLatest: "date", // Use the 'date' field to determine the latest record for getOne/cache checks

  // --- Optional Callbacks ---
  // validateRawData: (data: unknown): data is RawBalanceSheetStatement[] => { /* Add validation */ return true; },
  // processRawDataArray: (rawData: RawBalanceSheetStatement[]) => { /* Add filtering */ return rawData; },
};
