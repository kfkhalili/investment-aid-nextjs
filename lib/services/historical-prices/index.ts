/* ──────────────────────────────────────────────────────────────────────
 * lib/services/historical-prices/index.ts
 * Exports the dedicated service functions for historical prices.
 * ---------------------------------------------------------------------*/

export { getHistoricalPricesForSymbol } from "./fetchHistoricalPrices";
// Export the new function from its new file
export { getHistoricalPricesForAllSymbolsByDate } from "./fetchHistoricalPricesByDate";

// Re-export relevant types for consumers
export type { HistoricalPriceApiItem, HistoricalPriceRow } from "./types";
