/* ──────────────────────────────────────────────────────────────────────
 * lib/services/signals/getSignalsBySymbol.ts
 * Service to fetch signals for a specific symbol.
 * It attempts to trigger signal generation processes and then fetches signals.
 * ---------------------------------------------------------------------*/
import { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import type { SignalRow } from "./types";
// import { CACHE_TTL_MS } from "./constants"; // No longer used at this level

const SIGNALS_TABLE_NAME = "signals";

// --- Placeholder for your actual signal generation services ---
// These functions would be responsible for calculating and inserting new signal rows.
// They (or the specific generators they call) should ideally handle their own
// staleness checks to avoid redundant operations.
async function generateTechnicalSignals(symbol: string): Promise<void> {
  console.log(
    `[SignalGen] Placeholder: Attempting to generate technical signals for ${symbol}...`
  );
  // Example: await someTechnicalSignalService.generateForSymbol(symbol);
  // This function (or the service it calls) should ideally check its own staleness
  // before performing computationally expensive generation.
  return Promise.resolve();
}

async function generateEventBasedSignals(symbol: string): Promise<void> {
  console.log(
    `[SignalGen] Placeholder: Attempting to generate event-based signals for ${symbol}...`
  );
  // Example: await someEventSignalService.generateForSymbol(symbol);
  return Promise.resolve();
}
// --- End Placeholder ---

/**
 * Fetches all signals for a given symbol directly from Supabase.
 * @param supabase Supabase client instance.
 * @param symbol The stock symbol.
 * @returns Promise<SignalRow[]> An array of signal rows.
 */
async function fetchSignalsFromDb(
  supabase: SupabaseClient,
  symbol: string
): Promise<SignalRow[]> {
  const { data, error } = await supabase
    .from(SIGNALS_TABLE_NAME)
    .select("*") // Fetches all columns defined in SignalRow
    .eq("symbol", symbol.toUpperCase())
    .order("signal_date", { ascending: false }); // Optional: order by date

  if (error) {
    console.error(
      `[SignalSvc] Error fetching signals from DB for ${symbol}:`,
      error
    );
    throw new Error(
      `Database error fetching signals for ${symbol}: ${error.message}`
    );
  }
  // Ensure an array is always returned, even if data is null/undefined
  return (data as SignalRow[] | null)?.slice() || [];
}

/**
 * Fetches signals for a given symbol.
 * This function will first attempt to trigger signal generation processes
 * and then fetch all available signals for the symbol from the database.
 * The underlying generation services should manage their own staleness logic.
 *
 * @param symbol The stock symbol.
 * @returns Promise<SignalRow[]> An array of signal rows for the symbol.
 */
export async function getSignalsForSymbol(
  symbol: string
): Promise<SignalRow[]> {
  const supabase: SupabaseClient = getSupabaseServerClient();
  const upperSymbol = symbol.toUpperCase();

  console.log(
    `[SignalSvc] Processing signals for symbol: ${upperSymbol}. Attempting to trigger generation services first.`
  );

  try {
    // Attempt to trigger all relevant signal generation services.
    // These services (or the more specific modules they utilize)
    // should be responsible for their own internal staleness checks
    // to prevent unnecessary recalculations if data is already fresh.
    await generateTechnicalSignals(upperSymbol);
    await generateEventBasedSignals(upperSymbol);
    // Add more generation service calls if needed for other categories

    console.log(
      `[SignalSvc] Signal generation attempt phase complete for ${upperSymbol}.`
    );
  } catch (generationError: unknown) {
    console.error(
      `[SignalSvc] Error during signal generation attempt phase for ${upperSymbol}:`,
      generationError
    );
    // Depending on requirements, you might:
    // 1. Re-throw the error if fresh signals are critical and partial data is unacceptable.
    // 2. Log the error and proceed to fetch potentially stale/incomplete data.
    // For now, re-throwing to make failure explicit.
    throw new Error(
      `Signal generation attempt phase failed for ${upperSymbol}: ${
        generationError instanceof Error
          ? generationError.message
          : String(generationError)
      }`
    );
  }

  // After attempting generation, always fetch the current state of signals from the DB.
  console.log(`[SignalSvc] Fetching all signals from DB for ${upperSymbol}.`);
  return await fetchSignalsFromDb(supabase, upperSymbol);
}
