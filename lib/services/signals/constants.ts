/* ──────────────────────────────────────────────────────────────────────
 * lib/services/signals/constants.ts
 * Constants for the Signals service.
 * ---------------------------------------------------------------------*/
import type { SignalApiItem } from "./types";

/** Cache Time-To-Live: How long calculated signal data is considered fresh. */
// Example: 1 hour, adjust based on how often signals are recalculated
export const CACHE_TTL_MS = 1000 * 60 * 60 * 1;

/**
 * Defines the desired order and selection of keys for the Signal API response.
 * Uses snake_case keys from SignalApiItem based on the signals table DDL.
 * This can be used by the API route or a common mapping utility if needed.
 */
export const signalKeyOrder: ReadonlyArray<keyof SignalApiItem> = [
  "id", // Standard UUID identifier (string in API)
  "symbol", // Stock ticker symbol
  "signal_date", // Date the signal occurred
  "signal_code", // Specific signal identifier (e.g., 'SMA50_CROSS_ABOVE')
  "signal_category", // Broader category (e.g., 'technical')
  "signal_type", // 'event' or 'state'
  "confidence", // Optional confidence score
  "details", // Optional JSONB details
  // created_at and modified_at are typically excluded from the API response by the mapper
];
