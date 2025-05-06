/* ──────────────────────────────────────────────────────────────────────
 * src/api/balance-sheet-statements/service/constants.ts (Supabase Version)
 * Constants for the Balance Sheet Statement service.
 * ---------------------------------------------------------------------*/

// Import the BalanceSheetStatement API type definition (Supabase version)
import type { BalanceSheetStatement } from "./types";

/** Cache Time-To-Live: How long fetched data is considered fresh before re-fetching. */
// Example: 1 week (adjust as needed)
export const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7;

/**
 * Defines the desired order and selection of keys for the Balance Sheet API response.
 * This will be used in config.ts for the 'apiFieldOrder' property.
 * Corresponds to the keys in the Supabase-compatible BalanceSheetStatement API type (snake_case).
 */
export const balanceSheetKeyOrder: ReadonlyArray<keyof BalanceSheetStatement> =
  [
    "id", // Added by common mapper
    "symbol",
    "date",
    "reported_currency", // snake_case
    "cik",
    "filling_date", // snake_case
    "accepted_date", // snake_case
    "calendar_year", // snake_case
    "period",
    "cash_and_cash_equivalents", // snake_case
    "short_term_investments", // snake_case
    "cash_and_short_term_investments", // snake_case
    "net_receivables", // snake_case
    "inventory",
    "other_current_assets", // snake_case
    "total_current_assets", // snake_case
    "property_plant_equipment_net", // snake_case
    "goodwill",
    "intangible_assets", // snake_case
    "goodwill_and_intangible_assets", // snake_case
    "long_term_investments", // snake_case
    "tax_assets", // snake_case
    "other_non_current_assets", // snake_case
    "total_non_current_assets", // snake_case
    "other_assets", // snake_case
    "total_assets", // snake_case
    "account_payables", // snake_case
    "short_term_debt", // snake_case
    "tax_payables", // snake_case
    "deferred_revenue", // snake_case
    "other_current_liabilities", // snake_case
    "total_current_liabilities", // snake_case
    "long_term_debt", // snake_case
    "deferred_revenue_non_current", // snake_case
    "deferred_tax_liabilities_non_current", // snake_case
    "other_non_current_liabilities", // snake_case
    "total_non_current_liabilities", // snake_case
    "other_liabilities", // snake_case
    "capital_lease_obligations", // snake_case
    "total_liabilities", // snake_case
    "preferred_stock", // snake_case
    "common_stock", // snake_case
    "retained_earnings", // snake_case
    "accumulated_other_comprehensive_income_loss", // snake_case
    "othertotal_stockholders_equity", // snake_case
    "total_stockholders_equity", // snake_case
    "total_equity", // snake_case
    "total_liabilities_and_stockholders_equity", // snake_case
    "minority_interest", // snake_case
    "total_liabilities_and_total_equity", // snake_case
    "total_investments", // snake_case
    "total_debt", // snake_case
    "net_debt", // snake_case
    "link",
    "final_link", // snake_case
    // created_at and modified_at are excluded by the mapper
  ];
