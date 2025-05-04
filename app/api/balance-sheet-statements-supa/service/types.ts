/* ──────────────────────────────────────────────────────────────────────
 * src/api/balance-sheet-statement/service/types.ts (Supabase Version)
 * Type definitions and mappers for Balance Sheet Statement data using Supabase.
 * ---------------------------------------------------------------------*/
import type { Database } from "@/lib/supabase/database.types"; // Import generated DB types

// Define RowType using generated types
export type BalanceSheetStatementRow =
  Database["public"]["Tables"]["balance_sheet_statements"]["Row"];

// 1. Interface for Raw Data from FMP API (camelCase, added nullability)
export interface RawBalanceSheetStatement {
  date: string | null; // Potentially null from API? Add check/default
  symbol: string;
  reportedCurrency: string | null;
  cik: string | null;
  fillingDate: string | null;
  acceptedDate: string | null;
  calendarYear: string | null; // FMP often sends year as string
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
  otherNonCurrentAssets: number | null;
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
  capitalLeaseObligations?: number | null; // Keep optional and nullable
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

/**
 * Maps raw FMP API Balance Sheet data (camelCase) to the structure
 * needed for DB storage (snake_case), excluding id and timestamps.
 * Handles defaults (0 for numbers, null for strings/optional numbers).
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
    date: ensureDateString(raw.date), // REQUIRED
    symbol: raw.symbol, // REQUIRED
    reported_currency: raw.reportedCurrency ?? "USD", // REQUIRED
    cik: raw.cik ?? null,
    filling_date: ensureDateString(raw.fillingDate), // REQUIRED
    accepted_date: ensureTimestampString(raw.acceptedDate), // REQUIRED
    calendar_year: parseYear(raw.calendarYear), // REQUIRED
    period: raw.period, // REQUIRED

    // Map financial numbers, defaulting to 0 or null
    cash_and_cash_equivalents: raw.cashAndCashEquivalents ?? 0,
    short_term_investments: raw.shortTermInvestments ?? 0,
    cash_and_short_term_investments: raw.cashAndShortTermInvestments ?? 0,
    net_receivables: raw.netReceivables ?? 0,
    inventory: raw.inventory ?? 0,
    other_current_assets: raw.otherCurrentAssets ?? 0,
    total_current_assets: raw.totalCurrentAssets ?? 0,
    property_plant_equipment_net: raw.propertyPlantEquipmentNet ?? 0,
    goodwill: raw.goodwill ?? 0,
    intangible_assets: raw.intangibleAssets ?? 0,
    goodwill_and_intangible_assets: raw.goodwillAndIntangibleAssets ?? 0,
    long_term_investments: raw.longTermInvestments ?? 0,
    tax_assets: raw.taxAssets ?? 0,
    other_non_current_assets: raw.otherNonCurrentAssets ?? 0,
    total_non_current_assets: raw.totalNonCurrentAssets ?? 0,
    other_assets: raw.otherAssets ?? 0,
    total_assets: raw.totalAssets ?? 0,
    account_payables: raw.accountPayables ?? 0, // Note snake_case here matches DDL
    short_term_debt: raw.shortTermDebt ?? 0,
    tax_payables: raw.taxPayables ?? 0,
    deferred_revenue: raw.deferredRevenue ?? 0,
    other_current_liabilities: raw.otherCurrentLiabilities ?? 0,
    total_current_liabilities: raw.totalCurrentLiabilities ?? 0,
    long_term_debt: raw.longTermDebt ?? 0,
    deferred_revenue_non_current: raw.deferredRevenueNonCurrent ?? 0,
    deferred_tax_liabilities_non_current:
      raw.deferredTaxLiabilitiesNonCurrent ?? 0,
    other_non_current_liabilities: raw.otherNonCurrentLiabilities ?? 0,
    total_non_current_liabilities: raw.totalNonCurrentLiabilities ?? 0,
    other_liabilities: raw.otherLiabilities ?? 0,
    // Handle optional field - store null if missing/null/undefined
    capital_lease_obligations: raw.capitalLeaseObligations ?? null,
    total_liabilities: raw.totalLiabilities ?? 0,
    preferred_stock: raw.preferredStock ?? 0,
    common_stock: raw.commonStock ?? 0,
    retained_earnings: raw.retainedEarnings ?? 0,
    accumulated_other_comprehensive_income_loss:
      raw.accumulatedOtherComprehensiveIncomeLoss ?? 0,
    othertotal_stockholders_equity: raw.othertotalStockholdersEquity ?? 0,
    total_stockholders_equity: raw.totalStockholdersEquity ?? 0,
    total_equity: raw.totalEquity ?? 0,
    total_liabilities_and_stockholders_equity:
      raw.totalLiabilitiesAndStockholdersEquity ?? 0,
    minority_interest: raw.minorityInterest ?? 0,
    total_liabilities_and_total_equity: raw.totalLiabilitiesAndTotalEquity ?? 0,
    total_investments: raw.totalInvestments ?? 0,
    total_debt: raw.totalDebt ?? 0,
    net_debt: raw.netDebt ?? 0,
    link: raw.link ?? null,
    final_link: raw.finalLink ?? null,
  };
};
