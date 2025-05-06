/* ──────────────────────────────────────────────────────────────────────
 * lib/services/signals/getSignalsBySymbol.ts
 * Service to fetch signals for a specific symbol.
 * It attempts to trigger all relevant signal generation processes
 * (each handling its own staleness logic) and then fetches all signals.
 * ---------------------------------------------------------------------*/
import { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import type { SignalRow } from "./types"; // Your generic SignalRow type

// Import all individual signal processing services
import { processSmaSignalsForSymbol } from "@/lib/services/signal-sma/service";
import { processAnalystConsensusForSymbol } from "@/lib/services/signal-analyst-consensus/service";
import { processEarningsSignalsForSymbol } from "@/lib/services/signal-earnings/service";
import { processEmaSignalsForSymbol } from "@/lib/services/signal-ema/service";
import { processMacdSignalsForSymbol } from "@/lib/services/signal-macd/service";
import { processRsiSignalsForSymbol } from "@/lib/services/signal-rsi/service";

// Define a type for the processing results from individual services for logging
type IndividualSignalProcessingResult = {
  processedSymbol: string;
  signalsGenerated: number;
  status: string;
  error?: string;
  latestSignalDate?: string | null;
};

const SIGNALS_TABLE_NAME = "signals";

/**
 * Fetches all signals for a given symbol directly from Supabase.
 * @param supabase Supabase client instance.
 * @param symbol The stock symbol.
 * @returns Promise<SignalRow[]> An array of signal rows. Returns empty array on error.
 */
async function fetchSignalsFromDb(
  supabase: SupabaseClient,
  symbol: string
): Promise<SignalRow[]> {
  const { data, error } = await supabase
    .from(SIGNALS_TABLE_NAME)
    .select("*") // Fetches all columns defined in SignalRow
    .eq("symbol", symbol.toUpperCase())
    .order("signal_date", { ascending: false });

  if (error) {
    console.error(
      `[SignalSvc][fetchSignalsFromDb] Error fetching signals from DB for ${symbol}:`,
      error.message
    );
    return []; // Return empty array on error, allowing the main function to proceed
  }
  // Ensure an array is always returned, even if data is null/undefined
  return (data as SignalRow[] | null)?.slice() || [];
}

/**
 * Fetches signals for a given symbol.
 * This function will first attempt to trigger all relevant signal generation processes
 * (each handling its own staleness logic) and then fetch all available signals
 * for the symbol from the database.
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
    `[SignalSvc][getSignalsForSymbol] Orchestrating signal generation for symbol: ${upperSymbol}.`
  );

  // Pass the Supabase client to each service to avoid multiple client creations if preferred
  const generationPromises = [
    processSmaSignalsForSymbol(upperSymbol, supabase),
    processAnalystConsensusForSymbol(upperSymbol, supabase),
    processEarningsSignalsForSymbol(upperSymbol, supabase),
    processEmaSignalsForSymbol(upperSymbol, supabase),
    processMacdSignalsForSymbol(upperSymbol, supabase),
    processRsiSignalsForSymbol(upperSymbol, supabase),
    // Add calls to other signal processors here as they are developed
  ];

  // Use Promise.allSettled to run all generation attempts and not fail if one has an issue
  const results = await Promise.allSettled(generationPromises);

  console.log(
    `[SignalSvc][getSignalsForSymbol] Signal generation attempt phase complete for ${upperSymbol}. Results:`
  );
  const serviceNames: string[] = [
    "SMA",
    "AnalystConsensus",
    "Earnings",
    "EMA",
    "MACD",
    "RSI",
  ];

  results.forEach((result, index) => {
    const serviceName = serviceNames[index] || `Service ${index + 1}`;
    if (result.status === "fulfilled") {
      // Type assertion for result.value to access its properties
      const value = result.value as IndividualSignalProcessingResult;
      console.log(
        `  - ${serviceName}: Success - Status: ${value.status}, Generated: ${
          value.signalsGenerated
        }${value.error ? `, Error: ${value.error}` : ""}`
      );
    } else {
      // result.reason is the error thrown by the promise
      console.error(`  - ${serviceName}: Failed - Reason:`, result.reason);
    }
  });

  // After attempting all generations (successfully or not), fetch the current state of signals.
  console.log(
    `[SignalSvc][getSignalsForSymbol] Fetching all signals from DB for ${upperSymbol} after generation attempts.`
  );
  return await fetchSignalsFromDb(supabase, upperSymbol);
}
