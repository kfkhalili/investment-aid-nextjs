/* ──────────────────────────────────────────────────────────────────────
 * src/api/income-statements/service/constants.ts (Supabase Version)
 * Constants for the Income Statement service.
 * ---------------------------------------------------------------------*/

// Import the IncomeStatement API type definition (Supabase version)
import type { IncomeStatement } from "./types";

/** Cache Time-To-Live: How long fetched data is considered fresh before re-fetching. */
// Using 1 week like the previous example
export const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 1 week

/**
 * Defines the desired order and selection of keys for the Income Statement API response.
 * This will be used in config.ts for the 'apiFieldOrder' property.
 * Corresponds to the keys in the Supabase-compatible IncomeStatement API type (snake_case).
 */
export const incomeStatementKeyOrder: ReadonlyArray<keyof IncomeStatement> = [
  "id",
  "symbol",
  "date",
  "reported_currency",
  "cik",
  "filling_date",
  "accepted_date",
  "calendar_year",
  "period",
  "revenue",
  "cost_of_revenue",
  "gross_profit",
  "gross_profit_ratio",
  "research_and_development_expenses",
  "general_and_administrative_expenses",
  "selling_and_marketing_expenses",
  "selling_general_and_administrative_expenses",
  "other_expenses",
  "operating_expenses",
  "cost_and_expenses",
  "interest_income",
  "interest_expense",
  "depreciation_and_amortization",
  "ebitda",
  "ebitdaratio",
  "operating_income",
  "operating_income_ratio",
  "total_other_income_expenses_net",
  "income_before_tax",
  "income_before_tax_ratio",
  "income_tax_expense",
  "net_income",
  "net_income_ratio",
  "eps",
  "epsdiluted",
  "weighted_average_shs_out",
  "weighted_average_shs_out_dil",
  "link",
  "final_link",
  // created_at and modified_at are omitted by the mapper
];
