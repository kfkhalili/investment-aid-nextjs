/* ──────────────────────────────────────────────────────────────────────
 * src/api/historical-price/service/index.ts (Supabase Version)
 * Exports the dedicated service function for historical prices.
 * ---------------------------------------------------------------------*/

// Export the function we will create in the next step
export { getHistoricalPricesForSymbol } from "./fetchHistoricalPrices";

// Re-export relevant types for consumers
export type { HistoricalPriceApiItem, HistoricalPriceRow } from "./types";
