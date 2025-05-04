/* ──────────────────────────────────────────────────────────────────────
 * src/api/balance-sheet-statements/service/index.ts
 * Instantiates and exports the balance sheet service methods.
 * ---------------------------------------------------------------------*/

// 1. Import the generic service creator function
import { createGenericService } from "@/api/common";

// 2. Import the specific configuration for balance sheets
import { balanceSheetStatementConfig } from "./config";

// 3. Import specific types (optional, but good for re-export)
import type { BalanceSheetStatement, BalanceSheetStatementDoc } from "./types";

// --- Create the Balance Sheet Service Instance ---
const balanceSheetService = createGenericService(balanceSheetStatementConfig);

// --- Export Domain-Specific Service Methods ---
export const getLatestBalanceSheetStatement = balanceSheetService.getOne;
export const getBalanceSheetStatementsForSymbol =
  balanceSheetService.getAllForSymbol;
export const getAllBalanceSheetStatements = balanceSheetService.getAll;
export const getBalanceSheetStatementCollection =
  balanceSheetService.getCollection;

// EXPORT #2: Defines BalanceSheetStatement type export
export type { BalanceSheetStatement, BalanceSheetStatementDoc };
