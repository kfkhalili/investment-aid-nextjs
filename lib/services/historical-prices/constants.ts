/* ──────────────────────────────────────────────────────────────────────
 * lib/services/historical-prices/constants.ts
 * Constants for the Historical Price service.
 * ---------------------------------------------------------------------*/
import type { HistoricalPriceApiItem } from "./types"; // Import API type if defining order

/** Cache Time-To-Live: How long fetched data is considered fresh before re-fetching. */
// Example: 1 day for historical prices
export const CACHE_TTL_MS = 1000 * 60 * 60 * 24;

/**
 * Optional: Defines the desired order/selection of keys for the API response.
 * If used, the dedicated service function would need to implement reordering.
 * Uses snake_case keys from HistoricalPriceApiItem.
 */
export const historicalPriceKeyOrder: ReadonlyArray<
  keyof HistoricalPriceApiItem
> = [
  "id",
  "symbol",
  "date",
  "open",
  "high",
  "low",
  "close",
  "adj_close",
  "volume",
  "unadjusted_volume",
  "change",
  "change_percent",
  "vwap",
  "label",
  "change_over_time",
  // created_at and modified_at are typically excluded
];
