// app/api/signal/sma/route.ts

import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient"; // Adjust path if needed
import type { Database } from "@/lib/supabase/database.types"; // Adjust path if needed

// --- Types ---
type HistoricalPrice = Database["public"]["Tables"]["historical_prices"]["Row"];
type PriceDataPoint = Pick<HistoricalPrice, "date" | "close">;
type SignalInsert = Omit<
  Database["public"]["Tables"]["signals"]["Insert"],
  "signal_category" | "signal_type"
> & {
  signal_category: "technical";
  signal_type: "event" | "state";
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
const SMAs_REQUIRED: number[] = [50, 200]; // Only SMAs needed now
// const EMAs_REQUIRED: number[] = [50, 200]; // Removed EMA requirement
const LONGEST_MA_PERIOD = Math.max(...SMAs_REQUIRED); // Based only on SMAs
const REQUIRED_DATA_POINTS = LONGEST_MA_PERIOD + 1; // Need 1 extra point for T-1 calc
// ---

// --- Helper: Calculate Simple Moving Average (SMA) ---
function calculateSMAs(
  prices: PriceDataPoint[],
  periods: number[]
): MovingAverageValues {
  const calculatedMAs: MovingAverageValues = {};
  if (!prices || prices.length === 0) return calculatedMAs;
  for (const period of periods) {
    if (prices.length >= period) {
      const pricesForPeriod = prices.slice(0, period);
      const sum = pricesForPeriod.reduce(
        (acc, day) => acc + (day.close ?? 0),
        0
      );
      if (period > 0) {
        calculatedMAs[period] = parseFloat((sum / period).toFixed(2));
      }
    }
  }
  return calculatedMAs;
}

// --- Helper: Determine Price vs SMA Position Rank (1-5) ---
function getPriceVsSmaRank(
  close: number | null | undefined,
  sma50: number | null | undefined,
  sma200: number | null | undefined
): number | null {
  if (close == null || sma50 == null || sma200 == null) return null;
  const priceAbove50 = close > sma50;
  const priceAbove200 = close > sma200;
  const sma50Above200 = sma50 > sma200;
  if (priceAbove50 && sma50Above200) return 5;
  if (!priceAbove50 && !sma50Above200) return 1;
  if (
    (priceAbove50 && priceAbove200 && !sma50Above200) ||
    (!priceAbove50 && priceAbove200 && sma50Above200)
  )
    return 4;
  if (
    (priceAbove50 && !priceAbove200 && !sma50Above200) ||
    (!priceAbove50 && !priceAbove200 && sma50Above200)
  )
    return 2;
  if (
    (!priceAbove50 && priceAbove200 && !sma50Above200) ||
    (priceAbove50 && !priceAbove200 && sma50Above200)
  )
    return 3;
  console.warn(
    `[SMA Signal] Unhandled rank condition: P=${close}, SMA50=${sma50}, SMA200=${sma200}`
  ); // Corrected Prefix
  return null;
}

// --- Main Route Handler ---
export async function GET(request: NextRequest): Promise<NextResponse> {
  // --- Security Check ---
  const authToken = (request.headers.get("authorization") || "")
    .split("Bearer ")
    .at(1);
  if (process.env.CRON_SECRET && authToken !== process.env.CRON_SECRET) {
    console.warn("[SMA Signal] Unauthorized attempt"); // Corrected Prefix
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ---

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
    `[SMA Signal] Starting Batch ${batchNumber}, Symbols: ${symbolsForThisBatch.length}`
  ); // Corrected Prefix
  const supabase = getSupabaseServerClient();
  const allGeneratedSignals: SignalInsert[] = [];
  const errorsProcessing: { symbol: string; error: string }[] = [];

  // Process Batch
  for (const symbol of symbolsForThisBatch) {
    try {
      // Fetch enough data for longest SMA + T-1 calculation
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

      // Calculate SMAs for T and T-1
      const smasT = calculateSMAs(typedPrices, SMAs_REQUIRED);
      const smasTminus1 = calculateSMAs(typedPrices.slice(1), SMAs_REQUIRED);

      // --- Apply Signal Rules (SMA Only) ---
      const signalsForSymbol: SignalInsert[] = [];
      const signalDate = dataT.date;

      // Rule 1: Price vs SMA Position Rank (State Signal)
      const rankT = getPriceVsSmaRank(closeT, smasT[50], smasT[200]);
      if (rankT !== null) {
        signalsForSymbol.push({
          signal_date: signalDate,
          symbol: symbol,
          signal_category: "technical",
          signal_type: "state",
          signal_code: `PRICE_POS_RANK_${rankT}`,
          details: { close: closeT, sma50: smasT[50], sma200: smasT[200] },
        });
      }

      // Rule 2: SMA 50 Cross (Event Signal)
      const sma50T = smasT[50];
      const sma50Tminus1 = smasTminus1[50];
      if (
        closeT != null &&
        closeTminus1 != null &&
        sma50T != null &&
        sma50Tminus1 != null
      ) {
        let crossSignalCodeSMA50: string | null = null;
        if (closeT > sma50T && closeTminus1 < sma50Tminus1)
          crossSignalCodeSMA50 = "SMA50_CROSS_ABOVE";
        else if (closeT < sma50T && closeTminus1 > sma50Tminus1)
          crossSignalCodeSMA50 = "SMA50_CROSS_BELOW";
        if (crossSignalCodeSMA50) {
          signalsForSymbol.push({
            signal_date: signalDate,
            symbol: symbol,
            signal_category: "technical",
            signal_type: "event",
            signal_code: crossSignalCodeSMA50,
            details: {
              close: closeT,
              sma50: sma50T,
              prev_close: closeTminus1,
              prev_sma50: sma50Tminus1,
            },
          });
        }
      }

      // Rule 3: SMA 200 Cross (Event Signal)
      const sma200T = smasT[200];
      const sma200Tminus1 = smasTminus1[200];
      if (
        closeT != null &&
        closeTminus1 != null &&
        sma200T != null &&
        sma200Tminus1 != null
      ) {
        let crossSignalCodeSMA200: string | null = null;
        if (closeT > sma200T && closeTminus1 < sma200Tminus1)
          crossSignalCodeSMA200 = "SMA200_CROSS_ABOVE";
        else if (closeT < sma200T && closeTminus1 > sma200Tminus1)
          crossSignalCodeSMA200 = "SMA200_CROSS_BELOW";
        if (crossSignalCodeSMA200) {
          signalsForSymbol.push({
            signal_date: signalDate,
            symbol: symbol,
            signal_category: "technical",
            signal_type: "event",
            signal_code: crossSignalCodeSMA200,
            details: {
              close: closeT,
              sma200: sma200T,
              prev_close: closeTminus1,
              prev_sma200: sma200Tminus1,
            },
          });
        }
      }

      // --- EMA Logic Removed ---

      if (signalsForSymbol.length > 0) {
        allGeneratedSignals.push(...signalsForSymbol);
      }
    } catch (error: unknown) {
      let errorMessage = "Unknown processing error";
      if (error instanceof Error) errorMessage = error.message;
      console.error(`[SMA Signal] Error processing ${symbol}:`, error); // Corrected Prefix
      errorsProcessing.push({ symbol, error: errorMessage });
    }
  } // End loop

  // --- Store Generated Signals ---
  if (allGeneratedSignals.length > 0) {
    console.log(
      `[SMA Signal] Attempting to upsert ${allGeneratedSignals.length} signals...`
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
      console.error("[SMA Signal] Error upserting signals:", upsertError); // Corrected Prefix
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
    `[SMA Signal] Finished Batch ${batchNumber}. Processed: ${symbolsForThisBatch.length}. Signals Generated: ${allGeneratedSignals.length}. Errors: ${errorsProcessing.length}`
  ); // Corrected Prefix
  return NextResponse.json({
    message: `Processed Batch ${batchNumber}. Symbols attempted: ${symbolsForThisBatch.length}. Signals generated/checked: ${allGeneratedSignals.length}. Errors: ${errorsProcessing.length}`,
    errors: errorsProcessing,
  });
}
