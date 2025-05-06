/* ──────────────────────────────────────────────────────────────────────
 * src/api/balance-sheet-statements/service/types.ts (Supabase Version)
 * Type definitions and mappers for Balance Sheet Statement data using Supabase.
 * Includes rounding for BIGINT fields.
 * ---------------------------------------------------------------------*/
import type { Database } from "@/lib/supabase/database.types"; // Import generated DB types

// Define RowType using generated types
export type BalanceSheetStatementRow =
  Database["public"]["Tables"]["balance_sheet_statements"]["Row"];

// 1. Interface for Raw Data from FMP API (camelCase, added nullability)
export interface RawBalanceSheetStatement {
  date: string | null;
  symbol: string;
  reportedCurrency: string | null;
  cik: string | null;
  fillingDate: string | null;
  acceptedDate: string | null;
  calendarYear: string | null;
  period: string;
  cashAndCashEquivalents: number | null;
  shortTermInvestments: number | null;
  cashAndShortTermInvestments: number | null;
  netReceivables: number | null;
  inventory: number | null;
  otherCurrentAssets: number | null;
  totalCurrentAssets: number | null;
  propertyPlantEquipmentNet: number | null;
  goodwill: number | null;
  intangibleAssets: number | null;
  goodwillAndIntangibleAssets: number | null;
  longTermInvestments: number | null;
  taxAssets: number | null;
  otherNonCurrentAssets: number | null; // Source of one error
  totalNonCurrentAssets: number | null;
  otherAssets: number | null;
  totalAssets: number | null;
  accountPayables: number | null;
  shortTermDebt: number | null;
  taxPayables: number | null;
  deferredRevenue: number | null;
  otherCurrentLiabilities: number | null;
  totalCurrentLiabilities: number | null;
  longTermDebt: number | null;
  deferredRevenueNonCurrent: number | null;
  deferredTaxLiabilitiesNonCurrent: number | null;
  otherNonCurrentLiabilities: number | null;
  totalNonCurrentLiabilities: number | null;
  otherLiabilities: number | null;
  capitalLeaseObligations?: number | null; // Optional in Raw, Nullable in DB
  totalLiabilities: number | null;
  preferredStock: number | null;
  commonStock: number | null;
  retainedEarnings: number | null;
  accumulatedOtherComprehensiveIncomeLoss: number | null;
  othertotalStockholdersEquity: number | null;
  totalStockholdersEquity: number | null;
  totalEquity: number | null;
  totalLiabilitiesAndStockholdersEquity: number | null;
  minorityInterest: number | null;
  totalLiabilitiesAndTotalEquity: number | null;
  totalInvestments: number | null;
  totalDebt: number | null;
  netDebt: number | null;
  link: string | null;
  finalLink: string | null;
}

// 2. Interface for API Response Shape (Conceptual Full Type)
// Derived from BalanceSheetStatementRow (snake_case), includes string id
export interface BalanceSheetStatement
  extends Omit<BalanceSheetStatementRow, "id" | "modified_at" | "created_at"> {
  id: string; // API id is string
  // Inherits snake_case keys like cash_and_cash_equivalents, property_plant_equipment_net etc.
}
// Note: Service returns Partial<BalanceSheetStatement>

// --- Mapping Function (Raw -> Row Structure for DB) ---

// Helper function to round number or return 0 (for NOT NULL BIGINT columns)
const roundToBigIntOrZero = (value: number | null | undefined): number => {
  // Round to nearest integer, default to 0 if input is null/undefined
  return Math.round(value ?? 0);
};
// Helper function to round number or return null (for NULLABLE BIGINT columns)
const roundToBigIntOrNull = (
  value: number | null | undefined
): number | null => {
  // If input is null/undefined, return null, otherwise round to nearest integer
  if (value === null || value === undefined) return null;
  return Math.round(value);
};

/**
 * Maps raw FMP API Balance Sheet data (camelCase) to the structure
 * needed for DB storage (snake_case), excluding id and timestamps.
 * Handles defaults, type conversions, and rounding for BIGINT fields.
 */
export const mapRawBalanceSheetToRow = (
  raw: RawBalanceSheetStatement
): Omit<BalanceSheetStatementRow, "id" | "created_at" | "modified_at"> => {
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

  // Map RawBalanceSheetStatement (camelCase) keys to BalanceSheetStatementRow (snake_case) keys
  return {
    // Identifiers / Metadata (map and ensure NOT NULL if required by DB)
    date: ensureDateString(raw.date),
    symbol: raw.symbol,
    reported_currency: raw.reportedCurrency ?? "USD",
    cik: raw.cik ?? null,
    filling_date: ensureDateString(raw.fillingDate),
    accepted_date: ensureTimestampString(raw.acceptedDate),
    calendar_year: parseYear(raw.calendarYear), // Maps to SMALLINT
    period: raw.period,

    // --- Apply rounding using helpers for ALL BIGINT columns ---
    cash_and_cash_equivalents: roundToBigIntOrZero(raw.cashAndCashEquivalents),
    short_term_investments: roundToBigIntOrZero(raw.shortTermInvestments),
    cash_and_short_term_investments: roundToBigIntOrZero(
      raw.cashAndShortTermInvestments
    ),
    net_receivables: roundToBigIntOrZero(raw.netReceivables),
    inventory: roundToBigIntOrZero(raw.inventory),
    other_current_assets: roundToBigIntOrZero(raw.otherCurrentAssets),
    total_current_assets: roundToBigIntOrZero(raw.totalCurrentAssets),
    property_plant_equipment_net: roundToBigIntOrZero(
      raw.propertyPlantEquipmentNet
    ),
    goodwill: roundToBigIntOrZero(raw.goodwill),
    intangible_assets: roundToBigIntOrZero(raw.intangibleAssets),
    goodwill_and_intangible_assets: roundToBigIntOrZero(
      raw.goodwillAndIntangibleAssets
    ),
    long_term_investments: roundToBigIntOrZero(raw.longTermInvestments),
    tax_assets: roundToBigIntOrZero(raw.taxAssets),
    other_non_current_assets: roundToBigIntOrZero(raw.otherNonCurrentAssets), // Fixed
    total_non_current_assets: roundToBigIntOrZero(raw.totalNonCurrentAssets),
    other_assets: roundToBigIntOrZero(raw.otherAssets),
    total_assets: roundToBigIntOrZero(raw.totalAssets),
    account_payables: roundToBigIntOrZero(raw.accountPayables), // Note snake_case here matches DDL
    short_term_debt: roundToBigIntOrZero(raw.shortTermDebt),
    tax_payables: roundToBigIntOrZero(raw.taxPayables),
    deferred_revenue: roundToBigIntOrZero(raw.deferredRevenue),
    other_current_liabilities: roundToBigIntOrZero(raw.otherCurrentLiabilities),
    total_current_liabilities: roundToBigIntOrZero(raw.totalCurrentLiabilities),
    long_term_debt: roundToBigIntOrZero(raw.longTermDebt),
    deferred_revenue_non_current: roundToBigIntOrZero(
      raw.deferredRevenueNonCurrent
    ),
    deferred_tax_liabilities_non_current: roundToBigIntOrZero(
      raw.deferredTaxLiabilitiesNonCurrent
    ),
    other_non_current_liabilities: roundToBigIntOrZero(
      raw.otherNonCurrentLiabilities
    ),
    total_non_current_liabilities: roundToBigIntOrZero(
      raw.totalNonCurrentLiabilities
    ),
    other_liabilities: roundToBigIntOrZero(raw.otherLiabilities),
    // Use OrNull version for optional field mapped to a NULLABLE BIGINT column
    capital_lease_obligations: roundToBigIntOrNull(raw.capitalLeaseObligations),
    total_liabilities: roundToBigIntOrZero(raw.totalLiabilities),
    preferred_stock: roundToBigIntOrZero(raw.preferredStock),
    common_stock: roundToBigIntOrZero(raw.commonStock),
    retained_earnings: roundToBigIntOrZero(raw.retainedEarnings),
    accumulated_other_comprehensive_income_loss: roundToBigIntOrZero(
      raw.accumulatedOtherComprehensiveIncomeLoss
    ),
    othertotal_stockholders_equity: roundToBigIntOrZero(
      raw.othertotalStockholdersEquity
    ),
    total_stockholders_equity: roundToBigIntOrZero(raw.totalStockholdersEquity),
    total_equity: roundToBigIntOrZero(raw.totalEquity),
    total_liabilities_and_stockholders_equity: roundToBigIntOrZero(
      raw.totalLiabilitiesAndStockholdersEquity
    ),
    minority_interest: roundToBigIntOrZero(raw.minorityInterest),
    total_liabilities_and_total_equity: roundToBigIntOrZero(
      raw.totalLiabilitiesAndTotalEquity
    ),
    total_investments: roundToBigIntOrZero(raw.totalInvestments),
    total_debt: roundToBigIntOrZero(raw.totalDebt),
    net_debt: roundToBigIntOrZero(raw.netDebt),

    // Links (remain nullable strings)
    link: raw.link ?? null,
    final_link: raw.finalLink ?? null,
  };
};

// Note: mapRowToApi is handled by the common mapper
