// app/api/signal/rsi/route.ts

import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import type { Database } from "@/lib/supabase/database.types";

// --- Types ---
type HistoricalPrice = Database["public"]["Tables"]["historical_prices"]["Row"];
type PriceDataPoint = Pick<HistoricalPrice, "date" | "close">;
// Use the final signal structure, allowing both event and state types
type SignalInsert = Omit<
  Database["public"]["Tables"]["signals"]["Insert"],
  "signal_category" | "signal_type"
> & {
  signal_category: "technical";
  signal_type: "state" | "event";
};

// --- Configuration ---
// TODO: Use a shared symbol list or fetch dynamically
const ALL_SYMBOLS_TO_PROCESS: string[] = [
  "MSFT",
  "AAPL",
  "NVDA",
  "AMZN",
  "GOOGL",
  "META",
  "BRK-B",
  "AVGO",
  "TSLA",
  "LLY",
  "WMT",
  "JPM",
  "V",
  "MA",
  "NFLX",
  "XOM",
  "COST",
  "ORCL",
  "PG",
  "JNJ",
  "UNH",
  "HD",
  "ABBV",
  "KO",
  "BAC",
  "TSM",
  "TMUS",
  "PM",
  "CRM",
  "CVX",
  "WFC",
  "CSCO",
  "MCD",
  "ABT",
  "IBM",
  "GE",
  "MRK",
  "T",
  "NOW",
  "AXP",
  "PEP",
  "VZ",
  "MS",
  "ISRG",
  "GS",
  "INTU",
  "UBER",
  "RTX",
  "BKNG",
  "PGR",
  "GME",
];
const BATCH_SIZE = ALL_SYMBOLS_TO_PROCESS.length; // Process all in one batch for now
const RSI_PERIOD = 14; // Standard RSI period
const RSI_OVERBOUGHT_THRESHOLD = 70;
const RSI_OVERSOLD_THRESHOLD = 30;
// Need enough data points for RSI calculation for T and T-1
// (period + lookback for T-1) + 1 extra point for T's calculation = RSI_PERIOD + 50 + 1
const REQUIRED_DATA_POINTS_RSI = RSI_PERIOD + 50 + 1; // Fetch enough for T and T-1 RSI
// ---

// --- Helper: Calculate RSI ---
// Calculates the RSI for the *most recent* point in the provided price data array
// Assumes prices are sorted DESC (latest first)
function calculateLatestRSI(
  prices: PriceDataPoint[],
  period: number
): number | null {
  if (!prices || prices.length < period) {
    return null; // Not enough data
  }

  // Prices need to be ordered chronologically (oldest first) for calculation
  const orderedPrices = [...prices].reverse(); // Reverse the DESC array
  const closes = orderedPrices
    .map((p) => p.close)
    .filter((c) => c != null) as number[];

  if (closes.length < period) {
    return null; // Not enough non-null close prices
  }

  let gains = 0;
  let losses = 0;

  // Calculate initial average gain/loss
  for (let i = 1; i <= period; i++) {
    // Add check for array bounds
    if (i >= closes.length || i - 1 < 0) continue;
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) {
      gains += diff;
    } else {
      losses -= diff; // Losses are positive
    }
  }

  // Check if period is valid before division
  if (period === 0) return null; // Avoid division by zero

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Calculate subsequent smoothed averages up to the end of the array
  for (let i = period + 1; i < closes.length; i++) {
    // Add check for array bounds
    if (i >= closes.length || i - 1 < 0) continue;
    const diff = closes[i] - closes[i - 1];
    let currentGain = 0;
    let currentLoss = 0;
    if (diff >= 0) {
      currentGain = diff;
    } else {
      currentLoss = -diff;
    }
    // Ensure period is not 0 before division
    if (period === 0) return null; // Should not happen here but defensive check
    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;
  }

  if (avgLoss === 0) {
    return 100; // RSI is 100 if no losses
  }

  const rs = avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);

  return parseFloat(rsi.toFixed(2));
}

// --- Main Route Handler ---
export async function GET(request: NextRequest): Promise<NextResponse> {
  // --- Security Check ---
  const authToken = (request.headers.get("authorization") || "")
    .split("Bearer ")
    .at(1);
  if (process.env.CRON_SECRET && authToken !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ---

  console.log(
    `[RSI Signal] Starting RSI signal generation for ${ALL_SYMBOLS_TO_PROCESS.length} symbols.`
  );

  const supabase = getSupabaseServerClient();
  const signalsToInsert: SignalInsert[] = [];
  const errorsProcessing: { symbol: string; error: string }[] = [];

  // Batching setup
  const { searchParams } = new URL(request.url);
  const batchParam = searchParams.get("batch");
  const batchNumber = batchParam ? parseInt(batchParam, 10) : 1;
  const startIndex = (batchNumber - 1) * BATCH_SIZE;
  const endIndex = startIndex + BATCH_SIZE;
  const symbolsForThisBatch = ALL_SYMBOLS_TO_PROCESS.slice(
    startIndex,
    endIndex
  );

  if (symbolsForThisBatch.length === 0) {
    return NextResponse.json({
      message: `No symbols found for batch ${batchNumber}.`,
    });
  }
  console.log(
    `[RSI Signal] Processing Batch ${batchNumber}, Symbols: ${symbolsForThisBatch.length}`
  );

  // Process symbols
  for (const symbol of symbolsForThisBatch) {
    try {
      // 1. Fetch enough historical data for RSI T and T-1 calculation
      const { data: prices, error: dbError } = await supabase
        .from("historical_prices")
        .select("date, close")
        .eq("symbol", symbol)
        .order("date", { ascending: false })
        .limit(REQUIRED_DATA_POINTS_RSI); // Fetch enough data

      if (dbError) {
        throw new Error(
          `Supabase fetch error for ${symbol}: ${dbError.message}`
        );
      }

      const typedPrices = prices as PriceDataPoint[] | null;

      // Need enough data points to calculate RSI for T-1
      if (!typedPrices || typedPrices.length < RSI_PERIOD + 1) {
        throw new Error(
          `Insufficient data (< ${
            RSI_PERIOD + 1
          } days) for T/T-1 RSI calculation`
        );
      }

      const latestDataPoint = typedPrices[0]; // Data for T
      // const previousDataPoint = typedPrices[1]; // *** REMOVED - Unused variable ***

      // 2. Calculate RSI for T and T-1
      // RSI T uses all fetched points ending at T
      const rsiT = calculateLatestRSI(typedPrices, RSI_PERIOD);
      // RSI T-1 uses points ending at T-1 (slice(1) removes T)
      const rsiTminus1 = calculateLatestRSI(typedPrices.slice(1), RSI_PERIOD);

      if (rsiT === null) {
        throw new Error(`RSI calculation failed for T`);
      }
      // Don't throw if T-1 fails, just skip event generation
      if (rsiTminus1 === null) {
        console.warn(
          `[RSI Signal] RSI calculation failed for T-1 for ${symbol}, skipping event check.`
        );
      }

      // --- 3. Generate Signals ---
      const signalDate = latestDataPoint.date;
      let stateSignalCode: string | null = null;
      let eventSignalCode: string | null = null;

      // Check State (Overbought/Oversold) based on rsiT
      if (rsiT >= RSI_OVERBOUGHT_THRESHOLD) {
        stateSignalCode = "RSI_OVERBOUGHT";
      } else if (rsiT <= RSI_OVERSOLD_THRESHOLD) {
        stateSignalCode = "RSI_OVERSOLD";
      }

      // Check Events (Entering/Exiting zones) based on rsiT vs rsiTminus1
      if (rsiTminus1 !== null) {
        // Only check events if we have previous RSI
        // Entering Overbought
        if (
          rsiT >= RSI_OVERBOUGHT_THRESHOLD &&
          rsiTminus1 < RSI_OVERBOUGHT_THRESHOLD
        ) {
          eventSignalCode = "RSI_ENTERED_OVERBOUGHT";
        }
        // Exiting Overbought
        else if (
          rsiT < RSI_OVERBOUGHT_THRESHOLD &&
          rsiTminus1 >= RSI_OVERBOUGHT_THRESHOLD
        ) {
          eventSignalCode = "RSI_EXITED_OVERBOUGHT";
        }
        // Entering Oversold
        else if (
          rsiT <= RSI_OVERSOLD_THRESHOLD &&
          rsiTminus1 > RSI_OVERSOLD_THRESHOLD
        ) {
          eventSignalCode = "RSI_ENTERED_OVERSOLD";
        }
        // Exiting Oversold
        else if (
          rsiT > RSI_OVERSOLD_THRESHOLD &&
          rsiTminus1 <= RSI_OVERSOLD_THRESHOLD
        ) {
          eventSignalCode = "RSI_EXITED_OVERSOLD";
        }
      }

      // Add State Signal if applicable
      if (stateSignalCode) {
        signalsToInsert.push({
          signal_date: signalDate,
          symbol: symbol,
          signal_category: "technical",
          signal_type: "state", // This is a state signal
          signal_code: stateSignalCode,
          details: {
            rsi: rsiT,
            close: latestDataPoint.close,
            threshold:
              stateSignalCode === "RSI_OVERBOUGHT"
                ? RSI_OVERBOUGHT_THRESHOLD
                : RSI_OVERSOLD_THRESHOLD,
          },
        });
      }

      // Add Event Signal if applicable
      if (eventSignalCode) {
        signalsToInsert.push({
          signal_date: signalDate,
          symbol: symbol,
          signal_category: "technical",
          signal_type: "event", // This is an event signal
          signal_code: eventSignalCode,
          details: {
            rsi: rsiT,
            prev_rsi: rsiTminus1, // Include previous RSI for context
            close: latestDataPoint.close,
            threshold: eventSignalCode.includes("OVERBOUGHT")
              ? RSI_OVERBOUGHT_THRESHOLD
              : RSI_OVERSOLD_THRESHOLD,
          },
        });
        // console.log(`[RSI Signal] Staged ${eventSignalCode} for ${symbol} (RSI: ${rsiTminus1?.toFixed(2)} -> ${rsiT.toFixed(2)})`);
      }
    } catch (error: unknown) {
      let errorMessage = "Unknown processing error";
      if (error instanceof Error) errorMessage = error.message;
      console.error(`[RSI Signal] Error processing symbol ${symbol}:`, error);
      errorsProcessing.push({ symbol, error: errorMessage });
    }
  } // End symbol loop

  // Bulk Insert Signals
  if (signalsToInsert.length > 0) {
    console.log(
      `[RSI Signal] Inserting ${signalsToInsert.length} RSI signals...`
    );
    const typedSignalsToInsert =
      signalsToInsert as Database["public"]["Tables"]["signals"]["Insert"][];
    const { error: signalInsertError } = await supabase
      .from("signals")
      .upsert(typedSignalsToInsert, {
        onConflict: "symbol, signal_date, signal_code",
      });

    if (signalInsertError) {
      console.error("[RSI Signal] Error inserting signals:", signalInsertError);
      errorsProcessing.push({
        symbol: "BULK_RSI_SIGNAL_INSERT",
        error: signalInsertError.message,
      });
    }
  }

  // --- Return Response ---
  console.log(
    `[RSI Signal] Finished Run. Signals Generated: ${signalsToInsert.length}. Errors: ${errorsProcessing.length}`
  );
  return NextResponse.json({
    message: `Processed symbols: ${symbolsForThisBatch.length}. RSI Signals generated: ${signalsToInsert.length}. Errors: ${errorsProcessing.length}`,
    errors: errorsProcessing,
  });
}
