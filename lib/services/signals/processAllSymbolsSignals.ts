/* ──────────────────────────────────────────────────────────────────────
 * lib/services/signals/processAllSymbolsSignals.ts
 * Service to get distinct symbols and then process signals for each symbol
 * using the getSignalsForSymbol service.
 * ---------------------------------------------------------------------*/
import { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient"; // Adjust path if needed
import type { SignalRow } from "./types";
import { getSignalsForSymbol } from "./getSignalsBySymbol"; // Import the symbol-specific service

const PROFILE_SYMBOLS_VIEW_NAME = "profile_symbols"; // Name of your Supabase view

interface ProfileSymbolViewRow {
  symbol: string;
  // Add other columns from your view if needed, though only symbol is used here
}

/**
 * Fetches distinct symbols from the 'profile_symbols' view.
 * @param supabase Supabase client instance.
 * @returns Promise<string[]> An array of distinct symbols.
 */
async function getDistinctSymbols(supabase: SupabaseClient): Promise<string[]> {
  const { data, error } = await supabase
    .from(PROFILE_SYMBOLS_VIEW_NAME)
    .select("symbol"); // Select only the symbol column

  if (error) {
    console.error("[SignalSvcAll] Error fetching distinct symbols:", error);
    throw new Error(
      `Database error fetching distinct symbols: ${error.message}`
    );
  }

  if (!data) {
    return [];
  }
  // Extract symbols and ensure uniqueness (though the view should provide distinct symbols)
  return Array.from(
    new Set(data.map((row: ProfileSymbolViewRow) => row.symbol.toUpperCase()))
  );
}

/**
 * Ensures signals are up-to-date for all distinct symbols from the profile_symbols view
 * and returns an aggregated list of all signals.
 *
 * @returns Promise<SignalRow[]> An array containing all fresh signals for all processed symbols.
 */
export async function ensureAndGetAllSignals(): Promise<SignalRow[]> {
  const supabase: SupabaseClient = getSupabaseServerClient();
  const allProcessedSignals: SignalRow[] = [];

  console.log(
    "[SignalSvcAll] Starting process to ensure and get all signals..."
  );

  let distinctSymbols: string[];
  try {
    distinctSymbols = await getDistinctSymbols(supabase);
  } catch (error) {
    console.error(
      "[SignalSvcAll] Failed to retrieve distinct symbols. Aborting.",
      error
    );
    return []; // Or re-throw if this is a critical failure
  }

  if (distinctSymbols.length === 0) {
    console.log("[SignalSvcAll] No distinct symbols found to process.");
    return [];
  }

  console.log(
    `[SignalSvcAll] Found ${distinctSymbols.length} distinct symbols. Processing each...`
  );

  // Process each symbol sequentially to manage load, or consider Promise.all for parallel
  // For potentially long-running generation tasks, sequential might be safer.
  for (const symbol of distinctSymbols) {
    try {
      console.log(`[SignalSvcAll] Processing symbol: ${symbol}`);
      const signalsForCurrentSymbol = await getSignalsForSymbol(symbol);
      allProcessedSignals.push(...signalsForCurrentSymbol);
      console.log(
        `[SignalSvcAll] Finished processing for symbol: ${symbol}. Found ${signalsForCurrentSymbol.length} signals.`
      );
    } catch (error) {
      console.error(
        `[SignalSvcAll] Failed to process signals for symbol ${symbol}. Skipping. Error:`,
        error
      );
      // Continue with the next symbol
    }
  }

  console.log(
    `[SignalSvcAll] Finished processing all symbols. Total signals retrieved: ${allProcessedSignals.length}`
  );
  return allProcessedSignals;
}
