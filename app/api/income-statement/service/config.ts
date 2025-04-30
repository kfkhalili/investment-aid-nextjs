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
import { CACHE_TTL_MS } from "./constants";
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
 * Projection that explicitly includes ALL fields defined in the
 * IncomeStatementDoc interface (including inherited BaseDoc fields).
 * Using this ensures only expected fields are retrieved, even if
 * underlying documents contain more. Equivalent in outcome to omitting
 * projection, but more explicit.
 */
const listProjection: { [K in keyof IncomeStatementDoc]?: 1 } = {
  // Fields from BaseDoc
  _id: 1,
  symbol: 1,
  modifiedAt: 1,
  // Fields specific to IncomeStatementDoc
  date: 1,
  reportedCurrency: 1,
  cik: 1,
  fillingDate: 1,
  acceptedDate: 1,
  calendarYear: 1,
  period: 1,
  revenue: 1,
  costOfRevenue: 1,
  grossProfit: 1,
  grossProfitRatio: 1,
  researchAndDevelopmentExpenses: 1,
  generalAndAdministrativeExpenses: 1,
  sellingAndMarketingExpenses: 1,
  sellingGeneralAndAdministrativeExpenses: 1,
  otherExpenses: 1,
  operatingExpenses: 1,
  costAndExpenses: 1,
  interestIncome: 1,
  interestExpense: 1,
  depreciationAndAmortization: 1,
  ebitda: 1,
  ebitdaratio: 1,
  operatingIncome: 1,
  operatingIncomeRatio: 1,
  totalOtherIncomeExpensesNet: 1,
  incomeBeforeTax: 1,
  incomeBeforeTaxRatio: 1,
  incomeTaxExpense: 1,
  netIncome: 1,
  netIncomeRatio: 1,
  eps: 1,
  epsdiluted: 1,
  weightedAverageShsOut: 1,
  weightedAverageShsOutDil: 1,
  link: 1,
  finalLink: 1,
};

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
  collectionName: "income_statement", // MongoDB collection name
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
  listProjection: listProjection, // Projection for the getAll() list view (optional)

  // --- Behavior Modifiers for 'bySymbol' mode ---
  isSingleRecordPerSymbol: false, // FMP returns multiple historical records per symbol
  sortByFieldForLatest: "date", // Use the 'date' field to determine the latest record for getOne/cache checks

  // --- Optional Callbacks ---
  // validateRawData: (data: unknown): data is RawIncomeStatement[] => { /* Add validation */ return true; },
  // processRawDataArray: (rawData: RawIncomeStatement[]) => { /* Add filtering */ return rawData; },
};
