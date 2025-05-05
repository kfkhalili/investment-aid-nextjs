// app/api/signal/macd/route.ts

import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import type { Database } from "@/lib/supabase/database.types";

// --- Types ---
type HistoricalPrice = Database["public"]["Tables"]["historical_prices"]["Row"];
type PriceDataPoint = Pick<HistoricalPrice, "date" | "close">;
// Define SignalInsert based on the final table structure
type SignalInsert = Omit<
  Database["public"]["Tables"]["signals"]["Insert"],
  "signal_category" | "signal_type"
> & {
  signal_category: "technical";
  signal_type: "event"; // MACD crosses are events
};

// --- Configuration ---
// TODO: Use a shared symbol list
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
const BATCH_SIZE = ALL_SYMBOLS_TO_PROCESS.length; // Process all
const MACD_FAST_PERIOD = 12;
const MACD_SLOW_PERIOD = 26;
const MACD_SIGNAL_PERIOD = 9;
// Need enough data for the slowest EMA (26) plus the signal line EMA (9) plus lookback
const REQUIRED_DATA_POINTS_MACD = MACD_SLOW_PERIOD + MACD_SIGNAL_PERIOD + 50; // Fetch extra for stability
// ---

// --- Helper: Calculate Exponential Moving Average (EMA) ---
// Assumes values are ordered chronologically (oldest first)
function calculateEMAValues(values: number[], period: number): number[] {
  if (!values || values.length < period) return [];
  const k = 2 / (period + 1);
  const emaArray: number[] = [];
  let sum = 0;
  for (let i = 0; i < period; i++) {
    if (i >= values.length) return [];
    sum += values[i];
  }
  if (period === 0) return [];
  emaArray[period - 1] = sum / period;
  for (let i = period; i < values.length; i++) {
    if (i - 1 < 0 || i - 1 >= emaArray.length) continue;
    const ema = values[i] * k + emaArray[i - 1] * (1 - k);
    emaArray[i] = ema;
  }
  return emaArray.slice(period - 1);
}

// --- Helper: Calculate MACD and Signal Line values ---
// Returns arrays for MACD line and Signal line
// Assumes prices are sorted DESC (latest first)
function calculateMACD(
  prices: PriceDataPoint[],
  fastPeriod: number,
  slowPeriod: number,
  signalPeriod: number
): { macdLine: number[]; signalLine: number[]; dates: string[] } | null {
  if (!prices || prices.length < slowPeriod + signalPeriod) {
    return null;
  }

  const orderedPrices = [...prices].reverse();
  const closes = orderedPrices
    .map((p) => p.close)
    .filter((c) => c != null) as number[];
  const dates = orderedPrices.map((p) => p.date);

  if (closes.length < slowPeriod + signalPeriod) {
    return null;
  }

  const emaFast = calculateEMAValues(closes, fastPeriod);
  const emaSlow = calculateEMAValues(closes, slowPeriod);

  const fastOffset = closes.length - emaFast.length;
  const slowOffset = closes.length - emaSlow.length;
  const macdLine: number[] = [];
  const macdDates: string[] = [];

  for (let i = 0; i < emaSlow.length; i++) {
    const fastIndex = i + (slowOffset - fastOffset);
    if (fastIndex < 0 || fastIndex >= emaFast.length) continue;
    const macdValue = emaFast[fastIndex] - emaSlow[i];
    macdLine.push(macdValue);
    macdDates.push(dates[slowOffset + i]);
  }

  if (macdLine.length < signalPeriod) {
    return null;
  }

  const signalLine = calculateEMAValues(macdLine, signalPeriod);
  const macdOffset = macdLine.length - signalLine.length;
  const finalMacdLine = macdLine.slice(macdOffset);
  const finalSignalLine = signalLine;
  const finalDates = macdDates.slice(macdOffset);

  if (
    finalMacdLine.length !== finalSignalLine.length ||
    finalMacdLine.length !== finalDates.length
  ) {
    console.error(
      "[MACD Signal] Alignment error between MACD, Signal, and Dates."
    );
    return null;
  }

  return {
    macdLine: finalMacdLine.reverse(),
    signalLine: finalSignalLine.reverse(),
    dates: finalDates.reverse(),
  };
}

// --- Main Route Handler ---
export async function GET(request: NextRequest): Promise<NextResponse> {
  // --- Security Check ---
  const authToken = (request.headers.get("authorization") || "")
    .split("Bearer ")
    .at(1);
  if (process.env.CRON_SECRET && authToken !== process.env.CRON_SECRET) {
    console.warn("[MACD Signal] Unauthorized attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ---

  console.log(
    `[MACD Signal] Starting MACD signal generation for ${ALL_SYMBOLS_TO_PROCESS.length} symbols.`
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
    `[MACD Signal] Processing Batch ${batchNumber}, Symbols: ${symbolsForThisBatch.length}`
  );

  // Process symbols
  for (const symbol of symbolsForThisBatch) {
    try {
      // 1. Fetch enough historical data for MACD calculation
      const { data: prices, error: dbError } = await supabase
        .from("historical_prices")
        .select("date, close")
        .eq("symbol", symbol)
        .order("date", { ascending: false })
        .limit(REQUIRED_DATA_POINTS_MACD);

      if (dbError) {
        throw new Error(
          `Supabase fetch error for ${symbol}: ${dbError.message}`
        );
      }

      const typedPrices = prices as PriceDataPoint[] | null;

      // 2. Calculate MACD and Signal lines
      const macdResult = calculateMACD(
        typedPrices ?? [],
        MACD_FAST_PERIOD,
        MACD_SLOW_PERIOD,
        MACD_SIGNAL_PERIOD
      );

      // Need at least 2 points (T and T-1) for comparison
      if (
        !macdResult ||
        macdResult.macdLine.length < 2 ||
        macdResult.signalLine.length < 2
      ) {
        // Log this as info, not necessarily an error if stock is new
        console.log(
          `[MACD Signal] Insufficient data or calculation failed for MACD T/T-1 on ${symbol}`
        );
        continue; // Skip to next symbol
      }

      // --- 3. Apply Signal Rules ---
      const macdT = macdResult.macdLine[0];
      const signalT = macdResult.signalLine[0];
      const macdTminus1 = macdResult.macdLine[1];
      const signalTminus1 = macdResult.signalLine[1];
      const signalDate = macdResult.dates[0]; // Date of the latest calculation

      let signalCode: string | null = null;

      // Rule 1: MACD Line / Signal Line Cross
      if (macdT > signalT && macdTminus1 < signalTminus1) {
        signalCode = "MACD_CROSS_ABOVE";
      } else if (macdT < signalT && macdTminus1 > signalTminus1) {
        signalCode = "MACD_CROSS_BELOW";
      }

      if (signalCode) {
        signalsToInsert.push({
          signal_date: signalDate,
          symbol: symbol,
          signal_category: "technical",
          signal_type: "event",
          signal_code: signalCode,
          details: {
            macd: macdT,
            signal: signalT,
            prev_macd: macdTminus1,
            prev_signal: signalTminus1,
          },
        });
      }

      // Rule 2: MACD Line / Zero Line Cross
      signalCode = null; // Reset for next check
      if (macdT > 0 && macdTminus1 < 0) {
        signalCode = "MACD_ZERO_CROSS_ABOVE";
      } else if (macdT < 0 && macdTminus1 > 0) {
        signalCode = "MACD_ZERO_CROSS_BELOW";
      }

      if (signalCode) {
        signalsToInsert.push({
          signal_date: signalDate,
          symbol: symbol,
          signal_category: "technical",
          signal_type: "event",
          signal_code: signalCode,
          details: { macd: macdT, prev_macd: macdTminus1 },
        });
      }
    } catch (error: unknown) {
      let errorMessage = "Unknown processing error";
      if (error instanceof Error) errorMessage = error.message;
      console.error(`[MACD Signal] Error processing symbol ${symbol}:`, error);
      errorsProcessing.push({ symbol, error: errorMessage });
    }
  } // End symbol loop

  // Bulk Insert Signals
  if (signalsToInsert.length > 0) {
    console.log(
      `[MACD Signal] Inserting ${signalsToInsert.length} MACD signals...`
    );
    const typedSignalsToInsert =
      signalsToInsert as Database["public"]["Tables"]["signals"]["Insert"][];
    const { error: signalInsertError } = await supabase
      .from("signals")
      .upsert(typedSignalsToInsert, {
        onConflict: "symbol, signal_date, signal_code",
      });

    if (signalInsertError) {
      console.error(
        "[MACD Signal] Error inserting signals:",
        signalInsertError
      );
      errorsProcessing.push({
        symbol: "BULK_MACD_SIGNAL_INSERT",
        error: signalInsertError.message,
      });
    }
  }

  // --- Return Response ---
  console.log(
    `[MACD Signal] Finished Run. Signals Generated: ${signalsToInsert.length}. Errors: ${errorsProcessing.length}`
  );
  return NextResponse.json({
    message: `Processed symbols: ${symbolsForThisBatch.length}. MACD Signals generated: ${signalsToInsert.length}. Errors: ${errorsProcessing.length}`,
    errors: errorsProcessing,
  });
}
