/* ──────────────────────────────────────────────────────────────────────
 * src/api/cash-flow-statement/service/constants.ts (Supabase Version)
 * Constants for the Cash Flow Statement service.
 * ---------------------------------------------------------------------*/

// Import the CashFlowStatement API type definition (Supabase version)
import type { CashFlowStatement } from "./types";

/** Cache Time-To-Live: How long fetched data is considered fresh before re-fetching. */
// Using 1 week like the previous example
export const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 1 week

/**
 * Defines the desired order and selection of keys for the Cash Flow Statement API response.
 * This will be used in config.ts for the 'apiFieldOrder' property.
 * Corresponds to the keys in the Supabase-compatible CashFlowStatement API type (snake_case).
 */
export const cashFlowKeyOrder: ReadonlyArray<keyof CashFlowStatement> = [
  "id", // Added by common mapper
  "symbol",
  "date",
  "reported_currency", // snake_case
  "cik",
  "filling_date", // snake_case
  "accepted_date", // snake_case
  "calendar_year", // snake_case
  "period",
  "net_income", // snake_case
  "depreciation_and_amortization", // snake_case
  "deferred_income_tax", // snake_case
  "stock_based_compensation", // snake_case
  "change_in_working_capital", // snake_case
  "accounts_receivables", // snake_case
  "inventory",
  "accounts_payables", // snake_case
  "other_working_capital", // snake_case
  "other_non_cash_items", // snake_case
  "net_cash_provided_by_operating_activities", // snake_case
  "investments_in_property_plant_and_equipment", // snake_case
  "acquisitions_net", // snake_case
  "purchases_of_investments", // snake_case
  "sales_maturities_of_investments", // snake_case
  "other_investing_activites", // snake_case & corrected spelling
  "net_cash_used_for_investing_activites", // snake_case & corrected spelling
  "debt_repayment", // snake_case
  "common_stock_issued", // snake_case
  "common_stock_repurchased", // snake_case
  "dividends_paid", // snake_case
  "other_financing_activites", // snake_case & corrected spelling
  "net_cash_used_provided_by_financing_activities", // snake_case
  "effect_of_forex_changes_on_cash", // snake_case
  "net_change_in_cash", // snake_case
  "cash_at_end_of_period", // snake_case
  "cash_at_beginning_of_period", // snake_case
  "operating_cash_flow", // snake_case
  "capital_expenditure", // snake_case
  "free_cash_flow", // snake_case
  "link",
  "final_link", // snake_case
  // created_at and modified_at are excluded by the mapper
];
