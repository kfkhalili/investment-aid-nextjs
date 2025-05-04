import { IncomeStatement } from "./types";

/** how long we trust a snapshot (1 week) */
export const CACHE_TTL_MS = 60 * 24 * 7 * 60 * 1_000;

/**
 * Defines the desired order and selection of keys for the Income Statement API response.
 * This will be used in config.ts for the 'apiFieldOrder' property.
 * Corresponds to the keys in the IncomeStatement API type.
 */
export const incomeStatementKeyOrder: ReadonlyArray<keyof IncomeStatement> = [
  "symbol",
  "date",
  "reportedCurrency",
  "cik",
  "fillingDate",
  "acceptedDate",
  "calendarYear",
  "period",
  "revenue",
  "costOfRevenue",
  "grossProfit",
  "grossProfitRatio",
  "researchAndDevelopmentExpenses",
  "generalAndAdministrativeExpenses",
  "sellingAndMarketingExpenses",
  "sellingGeneralAndAdministrativeExpenses",
  "otherExpenses",
  "operatingExpenses",
  "costAndExpenses",
  "interestIncome",
  "interestExpense",
  "depreciationAndAmortization",
  "ebitda",
  "ebitdaratio",
  "operatingIncome",
  "operatingIncomeRatio",
  "totalOtherIncomeExpensesNet",
  "incomeBeforeTax",
  "incomeBeforeTaxRatio",
  "incomeTaxExpense",
  "netIncome",
  "netIncomeRatio",
  "eps",
  "epsdiluted",
  "weightedAverageShsOut",
  "weightedAverageShsOutDil",
  "link",
  "finalLink",
];
