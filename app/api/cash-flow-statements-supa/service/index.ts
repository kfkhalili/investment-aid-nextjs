/* ──────────────────────────────────────────────────────────────────────
 * src/api/cash-flow-statements/service/index.ts (Supabase Version)
 * Instantiates and exports the Supabase-based cash flow statement service methods.
 * ---------------------------------------------------------------------*/

// 1. Import the generic service creator function for SUPABASE
import { createGenericSupabaseService } from "@/api/common/supabase"; // Adjust path as needed

// 2. Import the specific configuration for cash flow statements (Supabase version)
import { cashFlowStatementConfig } from "./config";

// 3. Import specific types for Supabase (Raw, Row, and API types)
import type {
  CashFlowStatement,
  CashFlowStatementRow, // Use Row type
  RawCashFlowStatement,
} from "./types"; // Import from Supabase-specific types.ts

// --- Create the Cash Flow Statement Service Instance ---
// Instantiate the Supabase service with correct generic types
const cashFlowStatementService = createGenericSupabaseService<
  RawCashFlowStatement, // Type for raw FMP data
  CashFlowStatementRow, // Type for the database row (from generated types)
  CashFlowStatement // Conceptual API type (service returns Partial<CashFlowStatement>)
>(cashFlowStatementConfig);

// --- Export Domain-Specific Service Methods ---

/**
 * Fetches the latest cash flow statement for a specific symbol based on config.sortByFieldForLatest.
 * Handles caching and fetching from FMP if data is stale or missing.
 * Returns Promise<Partial<CashFlowStatement> | null>
 */
export const getLatestCashFlowStatement = cashFlowStatementService.getOne;

/**
 * Fetches all historical cash flow statements for a specific symbol, sorted newest first (based on service config).
 * Ensures the latest data is fresh before returning history.
 * Returns Promise<Partial<CashFlowStatement>[]>
 */
export const getCashFlowStatementsForSymbol =
  cashFlowStatementService.getAllForSymbol;

/**
 * Retrieves a list view of cash flow statements across all symbols.
 * Behavior depends on service config (e.g., uses projection from apiFieldOrder).
 * Returns Promise<Partial<CashFlowStatement>[]>
 */
export const getAllCashFlowStatements = cashFlowStatementService.getAll;

// Note: getCashFlowStatementCollection (MongoDB specific) is removed.

// --- Re-export Types ---
// Export types relevant for consumers using this service with Supabase
export type { CashFlowStatement, CashFlowStatementRow }; // Export Row type instead of Doc type
