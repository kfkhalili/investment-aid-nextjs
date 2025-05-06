/* ──────────────────────────────────────────────────────────────────────
 * src/api/earnings-calendar/service/constants.ts
 * Constants for the Earnings Calendar service.
 * ---------------------------------------------------------------------*/
import type { EarningsCalendarApiItem } from "./types"; // Import API type

/** Cache Time-To-Live: How long fetched data is considered fresh. */
// Example: 4 hours for earnings calendar (often updated intraday)
export const CACHE_TTL_MS = 1000 * 60 * 60 * 4;

/**
 * Defines the desired order and selection of keys for the API response.
 * Uses snake_case keys from EarningsCalendarApiItem.
 */
export const earningsCalendarKeyOrder: ReadonlyArray<
  keyof EarningsCalendarApiItem
> = [
  "id",
  "symbol",
  "date",
  "eps_estimated",
  "eps_actual",
  "revenue_estimated",
  "revenue_actual",
  "last_updated",
  // modified_at is excluded by mapper
];
