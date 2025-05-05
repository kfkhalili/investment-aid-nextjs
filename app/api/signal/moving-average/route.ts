// app/api/signal/moving-average/route.ts

import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient"; // Adjust path if needed
// We assume getHistoricalPricesForSymbol is NOT needed here, as we query directly
// import { getHistoricalPricesForSymbol } from '@/api/historical-price/service';
import type { Database } from "@/lib/supabase/database.types"; // Adjust path if needed

// --- Types ---
type HistoricalPrice = Database["public"]["Tables"]["historical_prices"]["Row"];
// Use Pick for stricter typing on selected columns
type PriceDataPoint = Pick<HistoricalPrice, "date" | "close">;
type SignalInsert = Database["public"]["Tables"]["signals"]["Insert"];
type MovingAverageValues = { [period: number]: number | undefined }; // Store calculated MAs

// --- Configuration ---
// TODO: Move symbol list to a config file, database table, or environment variable
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
];
// Adjust based on performance testing within Vercel's free tier timeout (~10s)
const BATCH_SIZE = 50;
// MAs needed for the signals we're generating in this specific function
const MAs_REQUIRED: number[] = [50, 200];
// ---

// --- Helper: Calculate MAs ---
// Calculates MAs for the specified periods using the provided prices (assumed sorted DESC)
function calculateMAs(
  prices: PriceDataPoint[],
  periods: number[]
): MovingAverageValues {
  const calculatedMAs: MovingAverageValues = {};
  if (!prices || prices.length === 0) return calculatedMAs;

  for (const period of periods) {
    if (prices.length >= period) {
      const pricesForPeriod = prices.slice(0, period);
      // Ensure close is treated as a number, default to 0 if null/undefined
      const sum = pricesForPeriod.reduce(
        (acc, day) => acc + (day.close ?? 0),
        0
      );
      if (period > 0) {
        // Should always be > 0 based on config
        calculatedMAs[period] = parseFloat((sum / period).toFixed(2));
      }
    }
    // If not enough data, the key for 'period' will be missing (or undefined)
  }
  return calculatedMAs;
}

// --- Helper: Determine Price vs MA Position Rank (1-5) ---
function getPriceVsMaRank(
  close: number | null | undefined,
  ma50: number | null | undefined,
  ma200: number | null | undefined
): number | null {
  if (close == null || ma50 == null || ma200 == null) {
    return null; // Cannot rank if essential data is missing
  }
  // Using the simplified 4-state model mapped to 1, 2, 4, 5 for clearer distinction
  // You can refine this logic based on the 5-rank discussion if needed
  if (close > ma50 && close > ma200) return 5; // Clearly Bullish
  if (close < ma50 && close > ma200) return 4; // Holding LT support, MT weak (Pullback?)
  if (close > ma50 && close < ma200) return 2; // Failing LT resistance, MT strong (Bounce?)
  if (close < ma50 && close < ma200) return 1; // Clearly Bearish

  return null; // Fallback, should ideally not be reached
}

// --- Main Route Handler ---
export async function GET(request: NextRequest): Promise<NextResponse> {
  // --- Security Check for Vercel Cron ---
  const authToken = (request.headers.get("authorization") || "")
    .split("Bearer ")
    .at(1);
  if (process.env.CRON_SECRET && authToken !== process.env.CRON_SECRET) {
    console.warn("[MA Signal Generator] Unauthorized attempt");
    return NextResponse.json("Unauthorized", { status: 401 });
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

  // --- Determine Symbols for this Batch ---
  const startIndex = (batchNumber - 1) * BATCH_SIZE;
  const endIndex = startIndex + BATCH_SIZE;
  const symbolsForThisBatch = ALL_SYMBOLS_TO_PROCESS.slice(
    startIndex,
    endIndex
  );

  if (symbolsForThisBatch.length === 0) {
    return NextResponse.json({
      message: `No symbols found for batch ${batchNumber}. Processing likely complete.`,
    });
  }

  console.log(
    `[MA Signal Generator] Starting Batch ${batchNumber}, Symbols: ${symbolsForThisBatch.length}, From index ${startIndex}`
  );

  const supabase = getSupabaseServerClient();
  const allGeneratedSignals: SignalInsert[] = [];
  const errorsProcessing: { symbol: string; error: string }[] = [];

  // --- Process Batch ---
  for (const symbol of symbolsForThisBatch) {
    try {
      // 1. Fetch data for T, T-1, and longest MA calculation
      const maxPeriod = Math.max(...MAs_REQUIRED);
      // Need N points for MA ending T-1, plus the point for T itself
      const requiredDataPoints = maxPeriod + 1; // e.g., 51 for SMA50 cross, 201 for SMA200 check

      const { data: prices, error: dbError } = await supabase
        .from("historical_prices")
        .select("date, close")
        .eq("symbol", symbol)
        .order("date", { ascending: false })
        .limit(requiredDataPoints);

      if (dbError) throw new Error(`Supabase fetch error: ${dbError.message}`);
      // Need at least 2 data points for T and T-1 comparison
      if (!prices || prices.length < 2)
        throw new Error(`Insufficient data (< 2 days)`);

      const typedPrices = prices as PriceDataPoint[];
      const dataT = typedPrices[0]; // Latest data point
      const dataTminus1 = typedPrices[1]; // Previous data point

      // 2. Calculate required MAs for T and T-1
      const masT = calculateMAs(typedPrices, MAs_REQUIRED);
      const masTminus1 = calculateMAs(typedPrices.slice(1), MAs_REQUIRED); // Use data starting from T-1

      // --- 3. Apply Signal Rules ---
      const signalsForSymbol: SignalInsert[] = [];
      const signalDate = dataT.date; // Signal occurred based on data available at end of this day

      // Rule 1: Price vs MA Position Rank (using 50 & 200 day MAs)
      const rankT = getPriceVsMaRank(dataT.close, masT[50], masT[200]);
      if (rankT !== null) {
        signalsForSymbol.push({
          signal_date: signalDate,
          symbol: symbol,
          signal_type: "technical",
          signal_code: `PRICE_POS_RANK_${rankT}`, // e.g., PRICE_POS_RANK_5
          status: "new",
          details: {
            close: dataT.close,
            ma50: masT[50],
            ma200: masT[200],
          },
        });
      }

      // Rule 2: SMA 50 Cross
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
            signal_type: "technical",
            signal_code: crossSignalCode,
            status: "new",
            details: {
              close: closeT,
              sma50: sma50T,
              prev_close: closeTminus1, // Optional context
              prev_sma50: sma50Tminus1, // Optional context
            },
          });
        }
      }

      // --- Add other MA-related rules here (e.g., SMA200 cross, Golden/Death Cross) ---

      // Add valid signals for this symbol to the main list
      if (signalsForSymbol.length > 0) {
        allGeneratedSignals.push(...signalsForSymbol);
      }
    } catch (error: unknown) {
      let errorMessage = "Unknown processing error";
      if (error instanceof Error) errorMessage = error.message;
      console.error(`[MA Signal Generator] Error processing ${symbol}:`, error);
      errorsProcessing.push({ symbol, error: errorMessage });
      // Continue to next symbol in the batch
    }
  } // End loop through symbols in batch

  // --- Store Generated Signals ---
  if (allGeneratedSignals.length > 0) {
    console.log(
      `[MA Signal Generator] Attempting to insert ${allGeneratedSignals.length} signals for Batch ${batchNumber}...`
    );
    const supabaseBulk = getSupabaseServerClient(); // Use separate client instance for bulk insert if needed, or reuse
    const { error: insertError } = await supabaseBulk
      .from("signals")
      .insert(allGeneratedSignals, {
        // If using the UNIQUE constraint: ignore duplicates silently
        // Note: Check Supabase docs for exact syntax if needed, might be UPSERT
        // onConflict: 'symbol, signal_date, signal_code', ignoreDuplicates: true // Example, adjust if needed
      });

    if (insertError) {
      console.error(
        `[MA Signal Generator] Error inserting signals for Batch ${batchNumber}:`,
        insertError
      );
      // Log error but still return partial success for processed symbols
      return NextResponse.json(
        {
          message: `Processed Batch ${batchNumber}. Symbols attempted: ${symbolsForThisBatch.length}. Generated: ${allGeneratedSignals.length} signals but FAILED to insert some/all.`,
          errorsProcessing: errorsProcessing,
          insertError: insertError.message,
        },
        { status: 500 }
      ); // Indicate partial failure
    }
  }

  // --- Return Response ---
  console.log(
    `[MA Signal Generator] Finished Batch ${batchNumber}. Symbols Processed: ${symbolsForThisBatch.length}. Signals Generated: ${allGeneratedSignals.length}. Errors: ${errorsProcessing.length}`
  );
  return NextResponse.json({
    message: `Processed Batch ${batchNumber}. Symbols attempted: ${symbolsForThisBatch.length}. Signals generated: ${allGeneratedSignals.length}. Errors: ${errorsProcessing.length}`,
    errors: errorsProcessing, // Return specific symbol errors
  });
}
