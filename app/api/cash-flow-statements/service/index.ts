/* ──────────────────────────────────────────────────────────────────────
 * src/api/income-statements/service/index.ts
 * Instantiates and exports the income statement service methods.
 * ---------------------------------------------------------------------*/

// 1. Import the generic service creator function
//    Adjust path as needed (e.g., if common/service has its own index.ts exporting this)
import { createGenericService } from "@/api/common";

// 2. Import the specific configuration for income statements
import { cashFlowStatementConfig } from "./config";

// 3. Import specific types for re-export (optional but recommended)
import type { CashFlowStatement, CashFlowStatementDoc } from "./types";

// --- Create the Income Statement Service Instance ---

const cashFlowStatementService = createGenericService(cashFlowStatementConfig);

// --- Export Domain-Specific Service Methods ---

/**
 * Retrieves the latest annual income statement for a given symbol.
 * Handles caching and fetching from FMP if data is stale or missing.
 * @param {string} symbol - The stock symbol (e.g., "AAPL").
 * @returns {Promise<IncomeStatement | null>} The latest statement or null.
 */
export const getLatestCashFlowStatement = cashFlowStatementService.getOne;

/**
 * Retrieves all stored annual income statements for a given symbol, sorted newest first.
 * Ensures the latest data is fresh before returning.
 * @param {string} symbol - The stock symbol (e.g., "AAPL").
 * @returns {Promise<IncomeStatement[]>} An array of statements.
 */
export const getCashFlowStatementsForSymbol =
  cashFlowStatementService.getAllForSymbol;

/**
 * Retrieves a list of income statements across all symbols in the cache.
 * NOTE: In 'bySymbol' fetch mode, this typically reads projected data
 * and does NOT trigger freshness checks for each symbol.
 * @returns {Promise<CashFlowStatement[]>} An array of statements (potentially partial if listProjection is used).
 */
export const getAllCashFlowStatements = cashFlowStatementService.getAll;

/**
 * Provides direct access to the underlying MongoDB collection promise
 * for income statements. Use with caution for custom queries.
 * @returns {Promise<Collection<CashFlowStatementDoc>>}
 */
export const getCashFlowStatementCollection =
  cashFlowStatementService.getCollection;

// --- Re-export specific types ---
// This allows importing types directly from the service index, e.g.:
// import { IncomeStatement } from '@/api/income-statements/service';
export type { CashFlowStatement, CashFlowStatementDoc };
