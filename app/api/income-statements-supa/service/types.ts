/* ──────────────────────────────────────────────────────────────────────
 * src/api/income-statements/service/types.ts (Supabase Version)
 * Type definitions and mappers for Income Statement data using Supabase.
 * ---------------------------------------------------------------------*/
import type { Database } from "@/lib/supabase/database.types"; // Import generated DB types

// Define RowType using generated types
// Assumes your table name in Supabase is 'income_statements'
export type IncomeStatementRow =
  Database["public"]["Tables"]["income_statements"]["Row"];

// 1. Interface for Raw Data from FMP API (camelCase, added potential nulls)
// This should match the structure returned BY FMP.
export interface RawIncomeStatement {
  date: string | null;
  symbol: string;
  reportedCurrency: string | null;
  cik: string | null;
  fillingDate: string | null;
  acceptedDate: string | null; // Timestamp string
  calendarYear: string | null; // FMP sends year as string
  period: string;
  revenue: number | null;
  costOfRevenue: number | null;
  grossProfit: number | null;
  grossProfitRatio: number | null;
  researchAndDevelopmentExpenses: number | null;
  generalAndAdministrativeExpenses: number | null;
  sellingAndMarketingExpenses: number | null;
  sellingGeneralAndAdministrativeExpenses: number | null;
  otherExpenses: number | null;
  operatingExpenses: number | null;
  costAndExpenses: number | null;
  interestIncome: number | null;
  interestExpense: number | null;
  depreciationAndAmortization: number | null;
  ebitda: number | null;
  ebitdaratio: number | null;
  operatingIncome: number | null;
  operatingIncomeRatio: number | null;
  totalOtherIncomeExpensesNet: number | null;
  incomeBeforeTax: number | null;
  incomeBeforeTaxRatio: number | null;
  incomeTaxExpense: number | null;
  netIncome: number | null;
  netIncomeRatio: number | null;
  eps: number | null;
  epsdiluted: number | null;
  weightedAverageShsOut: number | null;
  weightedAverageShsOutDil: number | null;
  link: string | null;
  finalLink: string | null;
}

// 2. Interface for API Response Shape (Conceptual Full Type)
// Derived from IncomeStatementRow (snake_case), includes string id.
export interface IncomeStatement
  extends Omit<IncomeStatementRow, "id" | "modified_at" | "created_at"> {
  id: string; // API id is string
  // Inherits snake_case keys like cost_of_revenue, gross_profit_ratio etc.
}
// Note: The generic service actually returns Partial<IncomeStatement>

// --- Mapping Function (Raw -> Row Structure for DB) ---

// Helper function to round number or return 0 (for BIGINT columns)
const roundToBigIntOrZero = (value: number | null | undefined): number => {
  // Round to nearest integer, default to 0 if input is null/undefined
  return Math.round(value ?? 0);
};

// Helper function to handle NUMERIC potentially null values (defaulting to 0)
// Use this for ratios, EPS etc. where decimals are expected in the DB NUMERIC type
const numericOrDefault = (value: number | null | undefined): number => {
  // Default to 0 if input is null/undefined, keep decimals otherwise
  return value ?? 0;
};

/**
 * Maps raw FMP API Income Statement data (camelCase) to the structure
 * needed for DB storage (snake_case), excluding id and timestamps.
 * Handles defaults, type conversions, and rounding for BIGINT fields.
 */
export const mapRawIncomeStatementToRow = (
  raw: RawIncomeStatement
): Omit<IncomeStatementRow, "id" | "created_at" | "modified_at"> => {
  // Helper to safely parse string year to number, providing a fallback
  const parseYear = (year: string | null): number => {
    if (!year) return new Date().getFullYear();
    const num = parseInt(year, 10);
    return isNaN(num) ? new Date().getFullYear() : num;
  };
  // Helper to provide default date strings if needed (matching NOT NULL constraints)
  const ensureDateString = (dateStr: string | null): string => {
    return dateStr || new Date().toISOString().split("T")[0];
  };
  const ensureTimestampString = (tsStr: string | null): string => {
    return tsStr || new Date().toISOString();
  };

  // Map RawIncomeStatement (camelCase) keys to IncomeStatementRow (snake_case) keys
  return {
    // Identifiers / Metadata (Ensure NOT NULL matches DB schema)
    date: ensureDateString(raw.date),
    symbol: raw.symbol,
    reported_currency: raw.reportedCurrency ?? "USD",
    cik: raw.cik ?? null,
    filling_date: ensureDateString(raw.fillingDate),
    accepted_date: ensureTimestampString(raw.acceptedDate),
    calendar_year: parseYear(raw.calendarYear),
    period: raw.period,

    // --- Apply rounding using helper for BIGINT columns ---
    revenue: roundToBigIntOrZero(raw.revenue),
    cost_of_revenue: roundToBigIntOrZero(raw.costOfRevenue),
    gross_profit: roundToBigIntOrZero(raw.grossProfit),
    research_and_development_expenses: roundToBigIntOrZero(
      raw.researchAndDevelopmentExpenses
    ), // Fixed
    general_and_administrative_expenses: roundToBigIntOrZero(
      raw.generalAndAdministrativeExpenses
    ),
    selling_and_marketing_expenses: roundToBigIntOrZero(
      raw.sellingAndMarketingExpenses
    ),
    selling_general_and_administrative_expenses: roundToBigIntOrZero(
      raw.sellingGeneralAndAdministrativeExpenses
    ),
    other_expenses: roundToBigIntOrZero(raw.otherExpenses),
    operating_expenses: roundToBigIntOrZero(raw.operatingExpenses),
    cost_and_expenses: roundToBigIntOrZero(raw.costAndExpenses),
    interest_income: roundToBigIntOrZero(raw.interestIncome),
    interest_expense: roundToBigIntOrZero(raw.interestExpense),
    depreciation_and_amortization: roundToBigIntOrZero(
      raw.depreciationAndAmortization
    ),
    ebitda: roundToBigIntOrZero(raw.ebitda),
    operating_income: roundToBigIntOrZero(raw.operatingIncome),
    total_other_income_expenses_net: roundToBigIntOrZero(
      raw.totalOtherIncomeExpensesNet
    ),
    income_before_tax: roundToBigIntOrZero(raw.incomeBeforeTax),
    income_tax_expense: roundToBigIntOrZero(raw.incomeTaxExpense),
    net_income: roundToBigIntOrZero(raw.netIncome),
    weighted_average_shs_out: roundToBigIntOrZero(raw.weightedAverageShsOut),
    weighted_average_shs_out_dil: roundToBigIntOrZero(
      raw.weightedAverageShsOutDil
    ),

    // --- Use simple default for NUMERIC columns (ratios, eps) ---
    gross_profit_ratio: numericOrDefault(raw.grossProfitRatio),
    ebitdaratio: numericOrDefault(raw.ebitdaratio),
    operating_income_ratio: numericOrDefault(raw.operatingIncomeRatio),
    income_before_tax_ratio: numericOrDefault(raw.incomeBeforeTaxRatio),
    net_income_ratio: numericOrDefault(raw.netIncomeRatio),
    eps: numericOrDefault(raw.eps),
    epsdiluted: numericOrDefault(raw.epsdiluted),

    // --- Links ---
    link: raw.link ?? null,
    final_link: raw.finalLink ?? null,
  };
};

// Note: mapRowToApi is handled by the common mapper
