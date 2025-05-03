/* ──────────────────────────────────────────────────────────────────────
 * src/api/cash-flow-statements/service/config.ts
 * Configuration for the Income Statement service.
 * ---------------------------------------------------------------------*/
import { IndexSpecification } from "mongodb";
import { GenericServiceConfig, FetchMode } from "@/api/common";

// Import specific types and mappers for Income Statements
import {
  RawCashFlowStatement,
  CashFlowStatementDoc,
  CashFlowStatement,
  mapRawCashFlowStatementToDoc,
} from "./types";

// Import or define cache TTL
// Assuming a local constants file exists:
import { CACHE_TTL_MS } from "./constants";
import { mapDocToPartialApi } from "@/api/common";

// --- Define specific configuration for the Income Statement service ---

/**
 * MongoDB index key definitions for the cash_flow_statement collection.
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

// Projection definition for Cash Flow Statements
// Use this in your config file (e.g., cash-flow-statement/service/config.ts)
// Adjust which fields have '1' based on what you need for list views.
const listProjection: { [K in keyof CashFlowStatementDoc]?: 1 } = {
  // Fields from BaseDoc (include if needed, e.g., for the mapper or display)
  _id: 1,
  symbol: 1,
  modifiedAt: 1, // Include if needed for display, otherwise mapper removes it

  // Fields specific to CashFlowStatementDoc
  date: 1,
  reportedCurrency: 1,
  cik: 1,
  fillingDate: 1,
  acceptedDate: 1,
  calendarYear: 1,
  period: 1,
  netIncome: 1,
  depreciationAndAmortization: 1,
  deferredIncomeTax: 1,
  stockBasedCompensation: 1,
  changeInWorkingCapital: 1,
  accountsReceivables: 1, // Often less critical for list view summary
  inventory: 1, // Often less critical for list view summary
  accountsPayables: 1, // Often less critical for list view summary
  otherWorkingCapital: 1, // Often less critical for list view summary
  otherNonCashItems: 1, // Often less critical for list view summary
  netCashProvidedByOperatingActivities: 1, // Key metric
  investmentsInPropertyPlantAndEquipment: 1, // Often same as CapEx
  acquisitionsNet: 1,
  purchasesOfInvestments: 1, // Often less critical for list view summary
  salesMaturitiesOfInvestments: 1, // Often less critical for list view summary
  otherInvestingActivites: 1, // Often less critical for list view summary
  netCashUsedForInvestingActivites: 1, // Key metric
  debtRepayment: 1,
  commonStockIssued: 1,
  commonStockRepurchased: 1,
  dividendsPaid: 1,
  otherFinancingActivites: 1, // Often less critical for list view summary
  netCashUsedProvidedByFinancingActivities: 1, // Key metric
  effectOfForexChangesOnCash: 1, // Often less critical for list view summary
  netChangeInCash: 1, // Key metric
  cashAtEndOfPeriod: 1, // Key metric
  cashAtBeginningOfPeriod: 1, // Often less critical for list view summary
  operatingCashFlow: 1, // Key metric (Often same as netCashProvidedByOperatingActivities)
  capitalExpenditure: 1, // Key metric
  freeCashFlow: 1, // Key metric
  link: 1, // Useful link
  finalLink: 1, // Useful link
};

/**
 * Configuration object passed to `createGenericService` to instantiate
 * the service for fetching and caching Income Statements.
 */
export const cashFlowStatementConfig: GenericServiceConfig<
  RawCashFlowStatement,
  CashFlowStatementDoc,
  CashFlowStatement
> = {
  // --- Core Identification & Storage ---
  collectionName: "cash_flow_statement", // MongoDB collection name
  collectionIndexes: collectionIndexes, // Index key definitions (options handled elsewhere)

  // --- FMP API Fetching ---
  fetchMode: FetchMode.BySymbol, // Fetch data per symbol
  fmpBasePath: "v3", // FMP API version path
  fmpPath: "cash-flow-statement", // FMP specific endpoint path
  fmpParams: { period: "annual" }, // Static query parameters for FMP API (fetch annual data)

  // --- Caching ---
  cacheTtlMs: CACHE_TTL_MS, // How long data is considered fresh

  // --- Data Structure, Uniqueness & Mapping ---
  uniqueKeyFields: ["symbol", "date"], // Fields defining a unique DB record for upserts
  mapRawToDoc: mapRawCashFlowStatementToDoc, // Function mapping FMP Raw -> DB structure
  mapDocToApi: mapDocToPartialApi, // Function mapping DB structure -> API response structure
  listProjection: listProjection, // Projection for the getAll() list view (optional)

  // --- Behavior Modifiers for 'bySymbol' mode ---
  isSingleRecordPerSymbol: false, // FMP returns multiple historical records per symbol
  sortByFieldForLatest: "date", // Use the 'date' field to determine the latest record for getOne/cache checks

  // --- Optional Callbacks ---
  // validateRawData: (data: unknown): data is RawIncomeStatement[] => { /* Add validation */ return true; },
  // processRawDataArray: (rawData: RawIncomeStatement[]) => { /* Add filtering */ return rawData; },
};
