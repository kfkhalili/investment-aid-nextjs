/* ──────────────────────────────────────────────────────────────────────
 * src/api/income-statements/service/index.ts (Supabase Version)
 * Instantiates and exports the Supabase-based income statement service methods.
 * ---------------------------------------------------------------------*/

// 1. Import the generic service creator function for SUPABASE
import { createGenericSupabaseService } from "@/api/common/supabase"; // Adjust path as needed

// 2. Import the specific configuration for income statements (Supabase version)
import { incomeStatementConfig } from "./config";

// 3. Import specific types for Supabase (Raw, Row, and API types)
import type {
  IncomeStatement,
  IncomeStatementRow,
  RawIncomeStatement,
} from "./types";

// --- Create the Income Statement Service Instance ---
// Instantiate the Supabase service with the correct generic types
const incomeStatementService = createGenericSupabaseService<
  RawIncomeStatement, // Type for raw FMP data
  IncomeStatementRow, // Type for the database row (from generated types)
  IncomeStatement // Conceptual API type (service returns Partial<IncomeStatement>)
>(incomeStatementConfig);

// --- Export Domain-Specific Service Methods ---

/**
 * Fetches the latest income statement for a specific symbol based on config.sortByFieldForLatest.
 * Returns Promise<Partial<IncomeStatement> | null>
 */
export const getLatestIncomeStatement = incomeStatementService.getOne;

/**
 * Fetches all historical income statements for a specific symbol.
 * Returns Promise<Partial<IncomeStatement>[]>
 */
export const getIncomeStatementsForSymbol =
  incomeStatementService.getAllForSymbol;

/**
 * Fetches a list view of income statements (behavior depends on service config/fetch mode).
 * Returns Promise<Partial<IncomeStatement>[]>
 */
export const getAllIncomeStatements = incomeStatementService.getAll;

// Note: getCollection (MongoDB specific) is removed.

// --- Re-export Types ---
// Export types relevant for consumers using this service with Supabase
export type { IncomeStatement, IncomeStatementRow };
