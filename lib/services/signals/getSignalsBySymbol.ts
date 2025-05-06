/* ──────────────────────────────────────────────────────────────────────
 * lib/services/signals/getSignalsBySymbol.ts
 * Service to fetch signals for a specific symbol, handling cache checks
 * and triggering signal generation if data is stale or missing.
 * ---------------------------------------------------------------------*/
import { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import type { SignalRow } from "./types";
import { CACHE_TTL_MS } from "./constants";

const SIGNALS_TABLE_NAME = "signals";

// --- Placeholder for your actual signal generation services ---
// These functions would be responsible for calculating and inserting new signal rows.
// They should ideally update the modified_at timestamp of the signals they create.
async function generateTechnicalSignals(symbol: string): Promise<void> {
  console.log(
    `[SignalGen] Placeholder: Generating technical signals for ${symbol}...`
  );
  // Example: await someTechnicalSignalService.generateForSymbol(symbol, supabase);
  // This function should ensure new signals are written to the SIGNALS_TABLE_NAME
  // with a current modified_at timestamp.
  return Promise.resolve();
}

async function generateEventBasedSignals(symbol: string): Promise<void> {
  console.log(
    `[SignalGen] Placeholder: Generating event-based signals for ${symbol}...`
  );
  // Example: await someEventSignalService.generateForSymbol(symbol, supabase);
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
  return data || [];
}

/**
 * Fetches signals for a given symbol.
 * If signals are stale or missing (based on CACHE_TTL_MS and 'modified_at' timestamp),
 * it triggers placeholder signal generation services and then fetches the fresh signals.
 *
 * @param symbol The stock symbol.
 * @returns Promise<SignalRow[]> An array of signal rows for the symbol.
 */
export async function getSignalsForSymbol(
  symbol: string
): Promise<SignalRow[]> {
  const supabase: SupabaseClient = getSupabaseServerClient();
  const upperSymbol = symbol.toUpperCase();

  console.log(`[SignalSvc] Processing signals for symbol: ${upperSymbol}`);

  // Step 1: Check cache status by looking at the most recent signal's modified_at
  const { data: latestSignal, error: latestSignalError } = await supabase
    .from(SIGNALS_TABLE_NAME)
    .select("modified_at")
    .eq("symbol", upperSymbol)
    .order("modified_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestSignalError) {
    console.error(
      `[SignalSvc] Error checking cache for ${upperSymbol}:`,
      latestSignalError
    );
    // Don't throw yet, might be no signals, proceed to generation.
  }

  let isCacheStale = true; // Assume stale by default
  if (latestSignal?.modified_at) {
    const lastModifiedTime = new Date(latestSignal.modified_at).getTime();
    if (Date.now() - lastModifiedTime < CACHE_TTL_MS) {
      isCacheStale = false;
    }
  }

  if (isCacheStale) {
    console.log(
      `[SignalSvc] Cache stale or signals missing for ${upperSymbol}. Triggering generation...`
    );
    try {
      // Trigger all relevant signal generation services
      // These should run sequentially or in parallel as appropriate for your logic
      await generateTechnicalSignals(upperSymbol);
      await generateEventBasedSignals(upperSymbol);
      // Add more generation service calls if needed

      console.log(`[SignalSvc] Signal generation complete for ${upperSymbol}.`);
      // After generation, fetch the newly created/updated signals
      return await fetchSignalsFromDb(supabase, upperSymbol);
    } catch (generationError) {
      console.error(
        `[SignalSvc] Error during signal generation for ${upperSymbol}:`,
        generationError
      );
      // Depending on requirements, you might want to return stale data if available,
      // or re-throw the error. For now, we'll attempt to fetch whatever is in DB.
      // If generation failed critically, fetchSignalsFromDb might return old or no data.
      // Consider if you want to return an empty array or throw.
      // Let's throw to indicate failure to refresh.
      throw new Error(
        `Signal generation failed for ${upperSymbol}: ${
          generationError instanceof Error
            ? generationError.message
            : String(generationError)
        }`
      );
    }
  } else {
    console.log(`[SignalSvc] Cache hit for ${upperSymbol}. Fetching from DB.`);
    return await fetchSignalsFromDb(supabase, upperSymbol);
  }
}
