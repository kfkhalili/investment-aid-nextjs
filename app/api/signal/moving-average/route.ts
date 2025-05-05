// app/api/signal/moving-average/route.ts

import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient"; // Adjust path if needed
import type { Database } from "@/lib/supabase/database.types"; // Adjust path if needed

// --- Types ---
type HistoricalPrice = Database["public"]["Tables"]["historical_prices"]["Row"];
type PriceDataPoint = Pick<HistoricalPrice, "date" | "close">;
// Define SignalInsert based on the final table structure with both columns
type SignalInsert = Omit<
  Database["public"]["Tables"]["signals"]["Insert"],
  "signal_category" | "signal_type"
> & {
  signal_category: "technical"; // Explicitly technical for this generator
  signal_type: "event" | "state";
};
type MovingAverageValues = { [period: number]: number | undefined };

// --- Configuration ---
const ALL_SYMBOLS_TO_PROCESS: string[] = [
  "MSFT", // Microsoft Corp.
  "AAPL", // Apple Inc.
  "NVDA", // NVIDIA Corp.
  "AMZN", // Amazon.com Inc.
  "GOOGL", // Alphabet Inc. Class A
  "META", // Meta Platforms, Inc.
  "BRK-B", // Berkshire Hathaway Inc. Class B
  "AVGO", // Broadcom Inc.
  "TSLA", // Tesla, Inc.
  "LLY", // Eli Lilly and Company
  "WMT", // Walmart Inc.
  "JPM", // JPMorgan Chase & Co.
  "V", // Visa Inc.
  "MA", // Mastercard Incorporated
  "NFLX", // Netflix, Inc.
  "XOM", // Exxon Mobil Corporation
  "COST", // Costco Wholesale Corp.
  "ORCL", // Oracle Corp.
  "PG", // Procter & Gamble Company
  "JNJ", // Johnson & Johnson
  "UNH", // UnitedHealth Group Inc.
  "HD", // The Home Depot, Inc.
  "ABBV", // AbbVie Inc.
  "KO", // The Coca-Cola Company
  "BAC", // Bank of America Corporation
  "TSM", // Taiwan Semiconductor Manufacturing Company Ltd. (ADR)
  "TMUS", // T-Mobile US, Inc.
  "PM", // Philip Morris International Inc.
  "CRM", // Salesforce, Inc.
  "CVX", // Chevron Corporation
  "WFC", // Wells Fargo & Co.
  "CSCO", // Cisco Systems, Inc.
  "MCD", // McDonald's Corporation
  "ABT", // Abbott Laboratories
  "IBM", // International Business Machines Corporation
  "GE", // General Electric Company / GE Aerospace
  "MRK", // Merck & Co., Inc.
  "T", // AT&T Inc.
  "NOW", // ServiceNow, Inc.
  "AXP", // American Express Company
  "PEP", // PepsiCo, Inc.
  "VZ", // Verizon Communications Inc.
  "MS", // Morgan Stanley
  "ISRG", // Intuitive Surgical, Inc.
  "GS", // The Goldman Sachs Group, Inc.
  "INTU", // Intuit Inc.
  "UBER", // Uber Technologies, Inc.
  "RTX", // RTX Corporation
  "BKNG", // Booking Holdings Inc.
  "PGR", // The Progressive Corporation
  "GME", // GameStop Corp
];
const BATCH_SIZE = ALL_SYMBOLS_TO_PROCESS.length; // Assuming 51 symbols fit now
const MAs_REQUIRED: number[] = [50, 200];
// ---

// --- Helper: Calculate MAs ---
function calculateMAs(
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

// --- Helper: Determine Price vs MA Position Rank (1-5) ---
function getPriceVsMaRank(
  close: number | null | undefined,
  ma50: number | null | undefined,
  ma200: number | null | undefined
): number | null {
  // (Keep the detailed 5-rank logic from the previous version here)
  if (close == null || ma50 == null || ma200 == null) return null;
  const priceAbove50 = close > ma50;
  const priceAbove200 = close > ma200;
  const ma50Above200 = ma50 > ma200;
  if (priceAbove50 && ma50Above200) return 5;
  if (!priceAbove50 && !ma50Above200) return 1;
  if (
    (priceAbove50 && priceAbove200 && !ma50Above200) ||
    (!priceAbove50 && priceAbove200 && ma50Above200)
  )
    return 4;
  if (
    (priceAbove50 && !priceAbove200 && !ma50Above200) ||
    (!priceAbove50 && !priceAbove200 && ma50Above200)
  )
    return 2;
  if (
    (!priceAbove50 && priceAbove200 && !ma50Above200) ||
    (priceAbove50 && !priceAbove200 && ma50Above200)
  )
    return 3;
  console.warn(
    `[MA Signal Generator] Unhandled rank condition: P=${close}, MA50=${ma50}, MA200=${ma200}`
  );
  return null;
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
    `[MA Signal Generator] Starting Batch ${batchNumber}, Symbols: ${symbolsForThisBatch.length}`
  );
  const supabase = getSupabaseServerClient();
  const allGeneratedSignals: SignalInsert[] = [];
  const errorsProcessing: { symbol: string; error: string }[] = [];

  // Process Batch
  for (const symbol of symbolsForThisBatch) {
    try {
      const maxPeriod = Math.max(...MAs_REQUIRED);
      const requiredDataPoints = maxPeriod + 1;

      const { data: prices, error: dbError } = await supabase
        .from("historical_prices")
        .select("date, close")
        .eq("symbol", symbol)
        .order("date", { ascending: false })
        .limit(requiredDataPoints);

      if (dbError) throw new Error(`Supabase fetch error: ${dbError.message}`);
      if (!prices || prices.length < 2)
        throw new Error(`Insufficient data (< 2 days)`);

      const typedPrices = prices as PriceDataPoint[];
      const dataT = typedPrices[0];
      const dataTminus1 = typedPrices[1];
      const masT = calculateMAs(typedPrices, MAs_REQUIRED);
      const masTminus1 = calculateMAs(typedPrices.slice(1), MAs_REQUIRED);

      // --- Apply Signal Rules ---
      const signalsForSymbol: SignalInsert[] = [];
      const signalDate = dataT.date;

      // Rule 1: Price vs MA Position Rank (State Signal)
      const rankT = getPriceVsMaRank(dataT.close, masT[50], masT[200]);
      if (rankT !== null) {
        signalsForSymbol.push({
          signal_date: signalDate,
          symbol: symbol,
          signal_category: "technical", // Set category
          signal_type: "state", // Set type to 'state'
          signal_code: `PRICE_POS_RANK_${rankT}`,
          details: { close: dataT.close, ma50: masT[50], ma200: masT[200] },
        });
      }

      // Rule 2: SMA 50 Cross (Event Signal)
      const closeT = dataT.close;
      const closeTminus1 = dataTminus1.close;
      const sma50T = masT[50];
      const sma50Tminus1 = masTminus1[50];

      if (
        closeT != null &&
        closeTminus1 != null &&
        sma50T != null &&
        sma50Tminus1 != null
      ) {
        let crossSignalCode: string | null = null;
        if (closeT > sma50T && closeTminus1 < sma50Tminus1) {
          crossSignalCode = "SMA50_CROSS_ABOVE";
        } else if (closeT < sma50T && closeTminus1 > sma50Tminus1) {
          crossSignalCode = "SMA50_CROSS_BELOW";
        }

        if (crossSignalCode) {
          signalsForSymbol.push({
            signal_date: signalDate,
            symbol: symbol,
            signal_category: "technical", // Set category
            signal_type: "event", // Set type to 'event'
            signal_code: crossSignalCode,
            details: {
              close: closeT,
              sma50: sma50T,
              prev_close: closeTminus1,
              prev_sma50: sma50Tminus1,
            },
          });
        }
      }
      // --- Add other MA-related rules here ---

      if (signalsForSymbol.length > 0) {
        allGeneratedSignals.push(...signalsForSymbol);
      }
    } catch (error: unknown) {
      let errorMessage = "Unknown processing error";
      if (error instanceof Error) errorMessage = error.message;
      console.error(`[MA Signal Generator] Error processing ${symbol}:`, error);
      errorsProcessing.push({ symbol, error: errorMessage });
    }
  } // End loop

  // --- Store Generated Signals ---
  if (allGeneratedSignals.length > 0) {
    console.log(
      `[MA Signal Generator] Attempting to upsert ${allGeneratedSignals.length} signals...`
    );
    const supabaseUpsert = getSupabaseServerClient();
    // Provide the explicit type for upsert, ensuring it matches the table structure
    const { error: upsertError } = await supabaseUpsert
      .from("signals")
      .upsert(
        allGeneratedSignals as Database["public"]["Tables"]["signals"]["Insert"][],
        {
          onConflict: "symbol, signal_date, signal_code",
        }
      );

    if (upsertError) {
      console.error(
        "[MA Signal Generator] Error upserting signals:",
        upsertError
      );
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
    `[MA Signal Generator] Finished Batch ${batchNumber}. Processed: ${symbolsForThisBatch.length}. Signals Generated: ${allGeneratedSignals.length}. Errors: ${errorsProcessing.length}`
  );
  return NextResponse.json({
    message: `Processed Batch ${batchNumber}. Symbols attempted: ${symbolsForThisBatch.length}. Signals generated/checked: ${allGeneratedSignals.length}. Errors: ${errorsProcessing.length}`,
    errors: errorsProcessing,
  });
}
