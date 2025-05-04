/* ──────────────────────────────────────────────────────────────────────
 * src/api/stock-screener/service/constants.ts (Supabase Version)
 * Constants for the Stock Screener service.
 * ---------------------------------------------------------------------*/

// Import the API type definition (Supabase version)
import type { StockScreenerItem } from "./types";

/** Cache Time-To-Live: How long fetched data is considered fresh before re-fetching. */
// Example: 4 hours for screener data
export const CACHE_TTL_MS = 1000 * 60 * 60 * 4;

/**
 * Defines the desired order and selection of keys for the Stock Screener API response.
 * This will be used in config.ts for the 'apiFieldOrder' property.
 * Corresponds to the keys in the Supabase-compatible StockScreenerApiItem type (snake_case).
 */
export const stockScreenerKeyOrder: ReadonlyArray<keyof StockScreenerItem> = [
  "id", // Added by common mapper
  "symbol",
  "company_name",
  "price",
  "market_cap",
  "volume",
  "exchange_short_name", // Often more useful than full name in lists
  "sector",
  "industry",
  "country",
  "beta",
  "last_annual_dividend",
  "is_actively_trading",
  "is_etf",
  "is_fund",
  // 'exchange', // Example: Omitting less critical fields for API response
  // created_at and modified_at are excluded by the mapper
];
