/* ──────────────────────────────────────────────────────────────────────
 * src/api/stock-screener/service/index.ts (Supabase Version)
 * Instantiates and exports the Supabase-based stock screener service methods.
 * ---------------------------------------------------------------------*/

// 1. Import the generic service creator function for SUPABASE
import { createGenericSupabaseService } from "@/api/common/supabase"; // Adjust path as needed

// 2. Import the specific configuration for stock screener (Supabase version)
import { stockScreenerConfig } from "./config";

// 3. Import specific types for Supabase (Raw, Row, and API types)
import type {
  StockScreenerItem,
  StockScreenerRow,
  RawStockScreenerItem,
} from "./types";

// --- Create the Stock Screener Service Instance ---
// Instantiate the Supabase service with correct generic types
const stockScreenerService = createGenericSupabaseService<
  RawStockScreenerItem, // Type for raw FMP data
  StockScreenerRow, // Type for the database row
  StockScreenerItem // Conceptual API type (service returns Partial<...>)
>(stockScreenerConfig);

// --- Export Domain-Specific Service Methods ---

/**
 * Fetches the latest full stock screener results list.
 * Handles caching and fetching from FMP if data is stale or missing.
 * Returns Promise<Partial<StockScreenerApiItem>[]>
 */
export const getStockScreenerResults = stockScreenerService.getAll;

// Note: getOne and getAllForSymbol are not typically relevant for a full screener snapshot.

// --- Re-export Types ---
// Export types relevant for consumers using this service with Supabase
export type { StockScreenerItem, StockScreenerRow };
