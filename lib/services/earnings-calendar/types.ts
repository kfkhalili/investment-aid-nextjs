/* ──────────────────────────────────────────────────────────────────────
 * src/api/earnings-calendar/service/types.ts (Supabase Version)
 * Type definitions and mappers for Earnings Calendar data using Supabase.
 * ---------------------------------------------------------------------*/
import type { Database } from "@/lib/supabase/database.types"; // Adjust path

// Define RowType using generated types
export type EarningsCalendarRow =
  Database["public"]["Tables"]["earnings_calendar"]["Row"];

// 1. Interface for Raw Data items from FMP API (camelCase)
export interface RawEarningsCalendarItem {
  symbol: string;
  date: string | null; // Date of earnings event
  epsActual: number | null;
  epsEstimated: number | null;
  revenueActual: number | null;
  revenueEstimated: number | null;
  lastUpdated: string | null; // Date string
}

// 2. Interface for API Response Shape (Conceptual Full Type)
// Derived from EarningsCalendarRow (snake_case), includes string id.
export interface EarningsCalendarApiItem
  extends Omit<EarningsCalendarRow, "id" | "modified_at" | "created_at"> {
  id: string; // API id is string
  // Inherits snake_case keys like eps_actual, revenue_estimated etc.
}
// Note: The generic service actually returns Partial<EarningsCalendarApiItem>

// --- Mapping Function (Raw -> Row Structure for DB) ---

// Helper for numeric fields (DOUBLE PRECISION), defaulting to null
const doubleOrNull = (value: number | null | undefined): number | null => {
  return value ?? null; // Keep decimals, default null
};
// Helper for numeric fields (BIGINT), defaulting to null and rounding
const bigIntOrNull = (value: number | null | undefined): number | null => {
  if (value === null || value === undefined) return null;
  return Math.round(value); // Round for BIGINT
};
// Helper for date strings, defaulting to null
const dateStringOrNull = (value: string | null | undefined): string | null => {
  // Basic check, though processRawDataArray does more thorough validation now for item.date
  if (value && typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  if (value === null || value === undefined) return null;
  return typeof value === "string" ? value : null;
};

/**
 * Maps raw FMP API Earnings Calendar item data (camelCase) to the structure
 * needed for DB storage (snake_case), excluding id and timestamps.
 * Handles defaults (null).
 */
export const mapRawEarningsCalendarToRow = (
  raw: RawEarningsCalendarItem // Receives data processed by processEarningsCalendarRawData
): Omit<EarningsCalendarRow, "id" | "created_at" | "modified_at"> => {
  return {
    symbol: raw.symbol,
    // raw.date is guaranteed to be a non-null, 'YYYY-MM-DD' string by processEarningsCalendarRawData
    date: raw.date!, // The '!' non-null assertion is now safe.
    eps_actual: doubleOrNull(raw.epsActual),
    eps_estimated: doubleOrNull(raw.epsEstimated),
    revenue_actual: bigIntOrNull(raw.revenueActual),
    revenue_estimated: bigIntOrNull(raw.revenueEstimated),
    // For last_updated (DB type DATE NULL): FMP might provide a full datetime string or just a date.
    // PostgreSQL's DATE type will truncate time if present.
    last_updated: dateStringOrNull(raw.lastUpdated),
  };
};
