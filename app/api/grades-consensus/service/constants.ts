/* ──────────────────────────────────────────────────────────────────────
 * src/api/grades-consensus/service/constants.ts
 * Constants for the Grades Consensus service.
 * ---------------------------------------------------------------------*/
import type { GradesConsensusApiItem } from "./types"; // Import API type

/** Cache Time-To-Live: How long fetched data is considered fresh. */
// Example: 1 day for consensus data
export const CACHE_TTL_MS = 1000 * 60 * 60 * 24;

/**
 * Defines the desired order and selection of keys for the API response.
 * Uses snake_case keys from GradesConsensusApiItem.
 */
export const gradesConsensusKeyOrder: ReadonlyArray<
  keyof GradesConsensusApiItem
> = [
  "id",
  "symbol",
  "date",
  "consensus",
  "strong_buy",
  "buy",
  "hold",
  "sell",
  "strong_sell",
];
