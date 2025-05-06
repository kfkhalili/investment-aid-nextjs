/* ──────────────────────────────────────────────────────────────────────
 * src/api/earnings-calendar/service/index.ts (Supabase Version)
 * Instantiates and exports the Supabase-based earnings calendar service methods.
 * ---------------------------------------------------------------------*/

// 1. Import the generic service creator function for SUPABASE
import { createGenericSupabaseService } from "@/lib/common/supabase"; // Adjusted path

// 2. Import the specific configuration
import { earningsCalendarConfig } from "./config";

// 3. Import specific types for Supabase
import type {
  EarningsCalendarApiItem,
  EarningsCalendarRow,
  RawEarningsCalendarItem,
} from "./types";

// --- Create the Service Instance ---
const earningsCalendarService = createGenericSupabaseService<
  RawEarningsCalendarItem,
  EarningsCalendarRow,
  EarningsCalendarApiItem
>(earningsCalendarConfig);

// --- Export Domain-Specific Service Methods ---

/**
 * Fetches the latest full earnings calendar snapshot.
 * Handles caching and fetching from FMP if data is stale or missing.
 * Returns Promise<Partial<EarningsCalendarApiItem>[]>
 */
export const getEarningsCalendar = earningsCalendarService.getAll;

// getOne and getAllForSymbol are less relevant for a full calendar snapshot
// but could be added if specific use cases arise.

// --- Re-export Types ---
export type { EarningsCalendarApiItem, EarningsCalendarRow };
