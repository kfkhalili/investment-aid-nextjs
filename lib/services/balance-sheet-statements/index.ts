/* ──────────────────────────────────────────────────────────────────────
 * src/api/balance-sheet-statements/service/index.ts (Supabase Version)
 * Instantiates and exports the Supabase-based balance sheet service methods.
 * ---------------------------------------------------------------------*/

// 1. Import the generic service creator function for SUPABASE
import { createGenericSupabaseService } from "@/lib/common/supabase"; // Adjust path as needed

// 2. Import the specific configuration for balance sheets (Supabase version)
import { balanceSheetStatementConfig } from "./config";

// 3. Import specific types for Supabase (Raw, Row, and API types)
import type {
  BalanceSheetStatement,
  BalanceSheetStatementRow, // Import Row type
  RawBalanceSheetStatement,
} from "./types"; // Import from Supabase-specific types.ts

// --- Create the Balance Sheet Service Instance ---
// Instantiate the Supabase service with correct generic types
const balanceSheetService = createGenericSupabaseService<
  RawBalanceSheetStatement, // Type for raw FMP data
  BalanceSheetStatementRow, // Type for the database row (from generated types)
  BalanceSheetStatement // Conceptual API type (service returns Partial<BalanceSheetStatement>)
>(balanceSheetStatementConfig);

// --- Export Domain-Specific Service Methods ---

/**
 * Fetches the latest balance sheet statement for a specific symbol based on config.sortByFieldForLatest.
 * Returns Promise<Partial<BalanceSheetStatement> | null>
 */
export const getLatestBalanceSheetStatement = balanceSheetService.getOne;

/**
 * Fetches all historical balance sheet statements for a specific symbol.
 * Returns Promise<Partial<BalanceSheetStatement>[]>
 */
export const getBalanceSheetStatementsForSymbol =
  balanceSheetService.getAllForSymbol;

/**
 * Fetches a list view of balance sheet statements (behavior depends on service config/fetch mode).
 * Returns Promise<Partial<BalanceSheetStatement>[]>
 */
export const getAllBalanceSheetStatements = balanceSheetService.getAll;

// Note: getBalanceSheetStatementCollection (MongoDB specific) is removed.

// --- Re-export Types ---
// Export types relevant for consumers using this service with Supabase
export type { BalanceSheetStatement, BalanceSheetStatementRow }; // Export Row type instead of Doc type
