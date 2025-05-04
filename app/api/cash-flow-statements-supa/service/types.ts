/* ──────────────────────────────────────────────────────────────────────
 * src/api/cash-flow-statements/service/types.ts (Supabase Version)
 * Type definitions and mappers for Cash Flow Statement data using Supabase.
 * Includes rounding for BIGINT fields.
 * ---------------------------------------------------------------------*/
import type { Database } from "@/lib/supabase/database.types"; // Import generated DB types

// Define RowType using generated types
// Assumes your table name in Supabase is 'cash_flow_statements'
export type CashFlowStatementRow =
  Database["public"]["Tables"]["cash_flow_statements"]["Row"];

// 1. Interface for Raw Data from FMP API (camelCase, added nullability)
export interface RawCashFlowStatement {
  date: string | null;
  symbol: string;
  reportedCurrency: string | null;
  cik: string | null;
  fillingDate: string | null;
  acceptedDate: string | null; // Timestamp string
  calendarYear: string | null; // FMP sends year as string
  period: string;
  netIncome: number | null;
  depreciationAndAmortization: number | null;
  deferredIncomeTax: number | null;
  stockBasedCompensation: number | null;
  changeInWorkingCapital: number | null;
  accountsReceivables: number | null;
  inventory: number | null;
  accountsPayables: number | null;
  otherWorkingCapital: number | null;
  otherNonCashItems: number | null;
  netCashProvidedByOperatingActivities: number | null;
  investmentsInPropertyPlantAndEquipment: number | null;
  acquisitionsNet: number | null;
  purchasesOfInvestments: number | null;
  salesMaturitiesOfInvestments: number | null;
  otherInvestingActivites: number | null; // Note FMP spelling
  netCashUsedForInvestingActivites: number | null; // Note FMP spelling
  debtRepayment: number | null;
  commonStockIssued: number | null;
  commonStockRepurchased: number | null;
  dividendsPaid: number | null;
  otherFinancingActivites: number | null; // Note FMP spelling
  netCashUsedProvidedByFinancingActivities: number | null;
  effectOfForexChangesOnCash: number | null;
  netChangeInCash: number | null;
  cashAtEndOfPeriod: number | null;
  cashAtBeginningOfPeriod: number | null;
  operatingCashFlow: number | null;
  capitalExpenditure: number | null;
  freeCashFlow: number | null;
  link: string | null;
  finalLink: string | null;
}

// 2. Interface for API Response Shape (Conceptual Full Type)
// Derived from CashFlowStatementRow (snake_case), includes string id
export interface CashFlowStatement
  extends Omit<CashFlowStatementRow, "id" | "modified_at" | "created_at"> {
  id: string; // API id is string
  // Inherits snake_case keys like depreciation_and_amortization, etc.
}
// Note: The generic service actually returns Partial<CashFlowStatement>

// --- Mapping Function (Raw -> Row Structure for DB) ---

// Helper function to round number or return 0 (for BIGINT columns)
const roundToBigIntOrZero = (value: number | null | undefined): number => {
  return Math.round(value ?? 0);
};
// Helper function to round number or return null (for NULLABLE BIGINT columns)
// Use this if your DB column allows NULL and you prefer null over 0 default
// const roundToBigIntOrNull = (value: number | null | undefined): number | null => {
//    if (value === null || value === undefined) return null;
//    return Math.round(value);
// };

/**
 * Maps raw FMP API Cash Flow Statement data (camelCase) to the structure
 * needed for DB storage (snake_case), excluding id and timestamps.
 * Handles defaults, type conversions, and rounding for BIGINT fields.
 */
export const mapRawCashFlowStatementToRow = (
  raw: RawCashFlowStatement
): Omit<CashFlowStatementRow, "id" | "created_at" | "modified_at"> => {
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

  // Map RawCashFlowStatement (camelCase assumed from FMP) keys to CashFlowStatementRow (snake_case) keys
  return {
    // Identifiers / Metadata (Ensure NOT NULL matches DB schema)
    date: ensureDateString(raw.date),
    symbol: raw.symbol,
    reported_currency: raw.reportedCurrency ?? "USD",
    cik: raw.cik ?? null,
    filling_date: ensureDateString(raw.fillingDate),
    accepted_date: ensureTimestampString(raw.acceptedDate),
    calendar_year: parseYear(raw.calendarYear), // SMALLINT
    period: raw.period,

    // --- Apply rounding using helper for ALL relevant BIGINT columns ---
    net_income: roundToBigIntOrZero(raw.netIncome),
    depreciation_and_amortization: roundToBigIntOrZero(
      raw.depreciationAndAmortization
    ),
    deferred_income_tax: roundToBigIntOrZero(raw.deferredIncomeTax),
    stock_based_compensation: roundToBigIntOrZero(raw.stockBasedCompensation),
    change_in_working_capital: roundToBigIntOrZero(raw.changeInWorkingCapital),
    accounts_receivables: roundToBigIntOrZero(raw.accountsReceivables),
    inventory: roundToBigIntOrZero(raw.inventory),
    accounts_payables: roundToBigIntOrZero(raw.accountsPayables),
    other_working_capital: roundToBigIntOrZero(raw.otherWorkingCapital),
    other_non_cash_items: roundToBigIntOrZero(raw.otherNonCashItems),
    net_cash_provided_by_operating_activities: roundToBigIntOrZero(
      raw.netCashProvidedByOperatingActivities
    ),
    investments_in_property_plant_and_equipment: roundToBigIntOrZero(
      raw.investmentsInPropertyPlantAndEquipment
    ),
    acquisitions_net: roundToBigIntOrZero(raw.acquisitionsNet),
    purchases_of_investments: roundToBigIntOrZero(raw.purchasesOfInvestments),
    sales_maturities_of_investments: roundToBigIntOrZero(
      raw.salesMaturitiesOfInvestments
    ),
    other_investing_activites: roundToBigIntOrZero(raw.otherInvestingActivites), // snake_case & corrected spelling
    net_cash_used_for_investing_activites: roundToBigIntOrZero(
      raw.netCashUsedForInvestingActivites
    ), // snake_case & corrected spelling
    debt_repayment: roundToBigIntOrZero(raw.debtRepayment),
    common_stock_issued: roundToBigIntOrZero(raw.commonStockIssued),
    common_stock_repurchased: roundToBigIntOrZero(raw.commonStockRepurchased),
    dividends_paid: roundToBigIntOrZero(raw.dividendsPaid),
    other_financing_activites: roundToBigIntOrZero(raw.otherFinancingActivites), // snake_case & corrected spelling
    net_cash_used_provided_by_financing_activities: roundToBigIntOrZero(
      raw.netCashUsedProvidedByFinancingActivities
    ),
    effect_of_forex_changes_on_cash: roundToBigIntOrZero(
      raw.effectOfForexChangesOnCash
    ),
    net_change_in_cash: roundToBigIntOrZero(raw.netChangeInCash),
    cash_at_end_of_period: roundToBigIntOrZero(raw.cashAtEndOfPeriod),
    cash_at_beginning_of_period: roundToBigIntOrZero(
      raw.cashAtBeginningOfPeriod
    ),
    operating_cash_flow: roundToBigIntOrZero(raw.operatingCashFlow),
    capital_expenditure: roundToBigIntOrZero(raw.capitalExpenditure),
    free_cash_flow: roundToBigIntOrZero(raw.freeCashFlow),

    // Links (remain nullable strings)
    link: raw.link ?? null,
    final_link: raw.finalLink ?? null,
  };
};

// Note: mapRowToApi is handled by the common mapper
