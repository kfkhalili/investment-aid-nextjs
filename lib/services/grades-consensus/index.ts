/* ──────────────────────────────────────────────────────────────────────
 * src/api/grades-consensus/service/index.ts (Supabase Version)
 * Instantiates and exports the Supabase-based grades consensus service methods.
 * Handles daily snapshots.
 * ---------------------------------------------------------------------*/

// 1. Import the generic service creator function for SUPABASE
import { createGenericSupabaseService } from "@/lib/common/supabase"; // Adjusted path

// 2. Import the specific configuration
import { gradesConsensusConfig } from "./config";

// 3. Import specific types for Supabase
import type {
  GradesConsensusApiItem,
  GradesConsensusRow, // Now includes id, date
  RawGradesConsensus,
} from "./types";

// --- Create the Service Instance ---
const gradesConsensusService = createGenericSupabaseService<
  RawGradesConsensus,
  GradesConsensusRow, // Now extends BaseRow
  GradesConsensusApiItem
>(gradesConsensusConfig);

// --- Export Domain-Specific Service Methods ---

/**
 * Fetches the LATEST daily grades consensus snapshot for a specific symbol.
 * Handles caching and fetching from FMP if data is stale or missing.
 * Returns Promise<Partial<GradesConsensusApiItem> | null>
 */
export const getLatestGradesConsensus = gradesConsensusService.getOne;

/**
 * Fetches ALL historical daily grades consensus snapshots for a specific symbol.
 * Ensures the latest data is fresh before returning history.
 * Returns Promise<Partial<GradesConsensusApiItem>[]>
 */
export const getGradesConsensusHistoryForSymbol =
  gradesConsensusService.getAllForSymbol;

/**
 * Fetches a list view of the LATEST grades consensus for ALL symbols.
 * NOTE: In 'BySymbol' mode, this reads projected data from cache/DB
 * and does NOT trigger freshness checks for each symbol individually.
 * Returns Promise<Partial<GradesConsensusApiItem>[]>
 */
export const getAllLatestGradesConsensus = gradesConsensusService.getAll;

// --- Export NEW Dedicated Function ---
/**
 * Fetches the grades consensus snapshot for a specific symbol AND specific date.
 * Does not involve caching logic itself.
 * Returns Promise<Partial<GradesConsensusApiItem> | null>
 */
export { getGradesConsensusForDateAndSymbol } from "./fetchByDate"; // <-- EXPORT NEW FUNCTION

// --- Re-export Types ---
export type { GradesConsensusApiItem, GradesConsensusRow };
