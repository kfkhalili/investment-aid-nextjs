// app/api/signal-ema/route.ts

import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient"; // Adjust path if needed
import type { Database } from "@/lib/supabase/database.types"; // Adjust path if needed

// --- Types ---
type HistoricalPrice = Database["public"]["Tables"]["historical_prices"]["Row"];
type PriceDataPoint = Pick<HistoricalPrice, "date" | "close">;
// Define SignalInsert based on the final table structure
type SignalInsert = Omit<
  Database["public"]["Tables"]["signals"]["Insert"],
  "signal_category" | "signal_type"
> & {
  signal_category: "technical";
  signal_type: "event"; // EMA crosses are events
};
type MovingAverageValues = { [period: number]: number | undefined };

// --- Configuration ---
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
const BATCH_SIZE = ALL_SYMBOLS_TO_PROCESS.length;
const EMAs_REQUIRED: number[] = [50, 200]; // EMAs needed for this generator
const LONGEST_MA_PERIOD = Math.max(...EMAs_REQUIRED);
// Need enough data for longest EMA + lookback + T-1 comparison
const REQUIRED_DATA_POINTS = LONGEST_MA_PERIOD + 50 + 1; // Add buffer + 1 for T-1 calc
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

// Calculates latest EMA values for specified periods from DESC sorted prices
function calculateEMAs(
  prices: PriceDataPoint[], // Assumed sorted DESC (latest first)
  periods: number[]
): MovingAverageValues {
  const calculatedEMAs: MovingAverageValues = {};
  if (!prices || prices.length === 0) return calculatedEMAs;
  const orderedPrices = [...prices].reverse();
  const closes = orderedPrices
    .map((p) => p.close)
    .filter((c) => c != null) as number[];

  for (const period of periods) {
    if (closes.length >= period) {
      const emaArray = calculateEMAValues(closes, period);
      if (emaArray.length > 0) {
        calculatedEMAs[period] = parseFloat(
          emaArray[emaArray.length - 1].toFixed(2)
        );
      }
    }
  }
  return calculatedEMAs;
}

// --- Main Route Handler ---
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const batchParam = searchParams.get("batch");
  const batchNumber = batchParam ? parseInt(batchParam, 10) : 1;

  if (isNaN(batchNumber) || batchNumber < 1) {
    return NextResponse.json(
      { error: "Invalid batch number." },
      { status: 400 }
    );
  }

  // Determine Symbols for this Batch
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
    `[EMA Signal] Starting Batch ${batchNumber}, Symbols: ${symbolsForThisBatch.length}`
  ); // Corrected Prefix
  const supabase = getSupabaseServerClient();
  const allGeneratedSignals: SignalInsert[] = [];
  const errorsProcessing: { symbol: string; error: string }[] = [];

  // Process Batch
  for (const symbol of symbolsForThisBatch) {
    try {
      // Fetch enough data for longest EMA + T-1 calculation
      const { data: prices, error: dbError } = await supabase
        .from("historical_prices")
        .select("date, close")
        .eq("symbol", symbol)
        .order("date", { ascending: false })
        .limit(REQUIRED_DATA_POINTS);

      if (dbError) throw new Error(`Supabase fetch error: ${dbError.message}`);
      if (!prices || prices.length < 2)
        throw new Error(`Insufficient data (< 2 days)`);

      const typedPrices = prices as PriceDataPoint[];
      const dataT = typedPrices[0];
      const dataTminus1 = typedPrices[1];
      const closeT = dataT.close;
      const closeTminus1 = dataTminus1.close;

      // Calculate EMAs for T and T-1
      const emasT = calculateEMAs(typedPrices, EMAs_REQUIRED);
      const emasTminus1 = calculateEMAs(typedPrices.slice(1), EMAs_REQUIRED);

      // --- Apply Signal Rules (EMA Only) ---
      const signalsForSymbol: SignalInsert[] = [];
      const signalDate = dataT.date;

      // Rule 1: EMA 50 Cross (Event Signal)
      const ema50T = emasT[50];
      const ema50Tminus1 = emasTminus1[50];
      if (
        closeT != null &&
        closeTminus1 != null &&
        ema50T != null &&
        ema50Tminus1 != null
      ) {
        let crossSignalCodeEMA50: string | null = null;
        if (closeT > ema50T && closeTminus1 < ema50Tminus1)
          crossSignalCodeEMA50 = "EMA50_CROSS_ABOVE";
        else if (closeT < ema50T && closeTminus1 > ema50Tminus1)
          crossSignalCodeEMA50 = "EMA50_CROSS_BELOW";
        if (crossSignalCodeEMA50) {
          signalsForSymbol.push({
            signal_date: signalDate,
            symbol: symbol,
            signal_category: "technical",
            signal_type: "event",
            signal_code: crossSignalCodeEMA50,
            details: {
              close: closeT,
              ema50: ema50T,
              prev_close: closeTminus1,
              prev_ema50: ema50Tminus1,
            },
          });
        }
      }

      // Rule 2: EMA 200 Cross (Event Signal)
      const ema200T = emasT[200];
      const ema200Tminus1 = emasTminus1[200];
      if (
        closeT != null &&
        closeTminus1 != null &&
        ema200T != null &&
        ema200Tminus1 != null
      ) {
        let crossSignalCodeEMA200: string | null = null;
        if (closeT > ema200T && closeTminus1 < ema200Tminus1)
          crossSignalCodeEMA200 = "EMA200_CROSS_ABOVE";
        else if (closeT < ema200T && closeTminus1 > ema200Tminus1)
          crossSignalCodeEMA200 = "EMA200_CROSS_BELOW";
        if (crossSignalCodeEMA200) {
          signalsForSymbol.push({
            signal_date: signalDate,
            symbol: symbol,
            signal_category: "technical",
            signal_type: "event",
            signal_code: crossSignalCodeEMA200,
            details: {
              close: closeT,
              ema200: ema200T,
              prev_close: closeTminus1,
              prev_ema200: ema200Tminus1,
            },
          });
        }
      }

      // --- Add EMA Golden/Death Cross logic here if desired (compare ema50T vs ema200T) ---

      if (signalsForSymbol.length > 0) {
        allGeneratedSignals.push(...signalsForSymbol);
      }
    } catch (error: unknown) {
      let errorMessage = "Unknown processing error";
      if (error instanceof Error) errorMessage = error.message;
      console.error(`[EMA Signal] Error processing ${symbol}:`, error); // Corrected Prefix
      errorsProcessing.push({ symbol, error: errorMessage });
    }
  } // End loop

  // --- Store Generated Signals ---
  if (allGeneratedSignals.length > 0) {
    console.log(
      `[EMA Signal] Attempting to upsert ${allGeneratedSignals.length} signals...`
    ); // Corrected Prefix
    const supabaseUpsert = getSupabaseServerClient();
    const typedSignalsToInsert =
      allGeneratedSignals as Database["public"]["Tables"]["signals"]["Insert"][];
    const { error: upsertError } = await supabaseUpsert
      .from("signals")
      .upsert(typedSignalsToInsert, {
        onConflict: "symbol, signal_date, signal_code",
      });

    if (upsertError) {
      console.error("[EMA Signal] Error upserting signals:", upsertError); // Corrected Prefix
      return NextResponse.json(
        {
          message: `Processed Batch ${batchNumber}. FAILED to upsert some/all signals.`,
          errorsProcessing: errorsProcessing,
          insertError: upsertError.message,
        },
        { status: 500 }
      );
    }
  }

  // --- Return Response ---
  console.log(
    `[EMA Signal] Finished Batch ${batchNumber}. Processed: ${symbolsForThisBatch.length}. Signals Generated: ${allGeneratedSignals.length}. Errors: ${errorsProcessing.length}`
  ); // Corrected Prefix
  return NextResponse.json({
    message: `Processed Batch ${batchNumber}. Symbols attempted: ${symbolsForThisBatch.length}. Signals generated/checked: ${allGeneratedSignals.length}. Errors: ${errorsProcessing.length}`,
    errors: errorsProcessing,
  });
}
