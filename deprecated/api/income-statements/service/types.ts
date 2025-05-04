/* ──────────────────────────────────────────────────────────────────────
 * src/api/income-statements/service/types.ts
 * Type definitions and mappers for Income Statement data.
 * ---------------------------------------------------------------------*/
// Adjust import path if your BaseDoc is elsewhere (e.g., /common/service/types)
import { BaseDoc } from "@/api/common";

// 1. Interface for Raw Data from FMP API
// Based on the provided example JSON structure
export interface RawIncomeStatement {
  date: string;
  symbol: string;
  reportedCurrency: string;
  cik: string | null;
  fillingDate: string;
  acceptedDate: string;
  calendarYear: string;
  period: string; // "FY", "Q1", etc.
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  grossProfitRatio: number;
  researchAndDevelopmentExpenses: number;
  generalAndAdministrativeExpenses: number; // Often zero/combined in FMP data
  sellingAndMarketingExpenses: number; // Often zero/combined in FMP data
  sellingGeneralAndAdministrativeExpenses: number;
  otherExpenses: number; // Often zero
  operatingExpenses: number;
  costAndExpenses: number;
  interestIncome: number; // Often zero or part of net
  interestExpense: number; // Often reported net
  depreciationAndAmortization: number;
  ebitda: number;
  ebitdaratio: number;
  operatingIncome: number;
  operatingIncomeRatio: number;
  totalOtherIncomeExpensesNet: number;
  incomeBeforeTax: number;
  incomeBeforeTaxRatio: number;
  incomeTaxExpense: number;
  netIncome: number;
  netIncomeRatio: number;
  eps: number;
  epsdiluted: number;
  weightedAverageShsOut: number;
  weightedAverageShsOutDil: number;
  link: string | null;
  finalLink: string | null;
}

// 2. Interface for MongoDB Document Structure
// Extends BaseDoc to include _id, symbol, modifiedAt
export interface IncomeStatementDoc extends BaseDoc {
  // Inherits _id, symbol, modifiedAt
  date: string; // Ensure date is here for sorting/uniqueness
  reportedCurrency: string;
  cik: string | null;
  fillingDate: string;
  acceptedDate: string;
  calendarYear: string;
  period: string;
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  grossProfitRatio: number;
  researchAndDevelopmentExpenses: number;
  generalAndAdministrativeExpenses: number;
  sellingAndMarketingExpenses: number;
  sellingGeneralAndAdministrativeExpenses: number;
  otherExpenses: number;
  operatingExpenses: number;
  costAndExpenses: number;
  interestIncome: number;
  interestExpense: number;
  depreciationAndAmortization: number;
  ebitda: number;
  ebitdaratio: number;
  operatingIncome: number;
  operatingIncomeRatio: number;
  totalOtherIncomeExpensesNet: number;
  incomeBeforeTax: number;
  incomeBeforeTaxRatio: number;
  incomeTaxExpense: number;
  netIncome: number;
  netIncomeRatio: number;
  eps: number;
  epsdiluted: number;
  weightedAverageShsOut: number;
  weightedAverageShsOutDil: number;
  link: string | null;
  finalLink: string | null;
}

// 3. Interface for API Response Shape
// Excludes DB-specific fields (_id as ObjectId, modifiedAt) and presents _id as string
export interface IncomeStatement
  extends Omit<IncomeStatementDoc, "_id" | "modifiedAt"> {
  _id: string; // Override _id to be string type for API consumers
}

// --- Mapping Functions ---

/**
 * Maps the raw FMP API data structure to the structure needed for MongoDB storage
 * (excluding _id and modifiedAt). Applies defaults for potentially missing numeric fields.
 */
export const mapRawIncomeStatementToDoc = (
  raw: RawIncomeStatement
): Omit<IncomeStatementDoc, "_id" | "modifiedAt"> => ({
  // Ensure all fields from DocType (except _id, modifiedAt) are mapped
  date: raw.date,
  symbol: raw.symbol,
  reportedCurrency: raw.reportedCurrency,
  cik: raw.cik,
  fillingDate: raw.fillingDate,
  acceptedDate: raw.acceptedDate,
  calendarYear: raw.calendarYear,
  period: raw.period,
  // Use nullish coalescing to default potentially missing numeric fields to 0
  revenue: raw.revenue ?? 0,
  costOfRevenue: raw.costOfRevenue ?? 0,
  grossProfit: raw.grossProfit ?? 0,
  grossProfitRatio: raw.grossProfitRatio ?? 0,
  researchAndDevelopmentExpenses: raw.researchAndDevelopmentExpenses ?? 0,
  generalAndAdministrativeExpenses: raw.generalAndAdministrativeExpenses ?? 0,
  sellingAndMarketingExpenses: raw.sellingAndMarketingExpenses ?? 0,
  sellingGeneralAndAdministrativeExpenses:
    raw.sellingGeneralAndAdministrativeExpenses ?? 0,
  otherExpenses: raw.otherExpenses ?? 0,
  operatingExpenses: raw.operatingExpenses ?? 0,
  costAndExpenses: raw.costAndExpenses ?? 0,
  interestIncome: raw.interestIncome ?? 0,
  interestExpense: raw.interestExpense ?? 0,
  depreciationAndAmortization: raw.depreciationAndAmortization ?? 0,
  ebitda: raw.ebitda ?? 0,
  ebitdaratio: raw.ebitdaratio ?? 0,
  operatingIncome: raw.operatingIncome ?? 0,
  operatingIncomeRatio: raw.operatingIncomeRatio ?? 0,
  totalOtherIncomeExpensesNet: raw.totalOtherIncomeExpensesNet ?? 0,
  incomeBeforeTax: raw.incomeBeforeTax ?? 0,
  incomeBeforeTaxRatio: raw.incomeBeforeTaxRatio ?? 0,
  incomeTaxExpense: raw.incomeTaxExpense ?? 0,
  netIncome: raw.netIncome ?? 0,
  netIncomeRatio: raw.netIncomeRatio ?? 0,
  eps: raw.eps ?? 0,
  epsdiluted: raw.epsdiluted ?? 0,
  weightedAverageShsOut: raw.weightedAverageShsOut ?? 0,
  weightedAverageShsOutDil: raw.weightedAverageShsOutDil ?? 0,
  link: raw.link, // Keep null if null
  finalLink: raw.finalLink, // Keep null if null
  // modifiedAt is added by the generic service
});
