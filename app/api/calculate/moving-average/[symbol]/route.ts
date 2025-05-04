// app/api/calculate/moving-average/[symbol]/route.ts

import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient"; // Adjust path if needed
import { getHistoricalPricesForSymbol } from "@/api/historical-price/service"; // Adjust path if needed
import type { Database } from "@/lib/supabase/database.types"; // Adjust path if needed

// Define the shape of the data coming from your table using generated types
// Ensure 'historical_prices' table and its columns ('date', 'close') exist in your Database types
type HistoricalPrice = Database["public"]["Tables"]["historical_prices"]["Row"];

// Define the response structure
type MovingAverageResponse = {
  symbol: string;
  latestDate?: string;
  latestClose?: number;
  movingAverages?: { [period: number]: number }; // e.g., { 20: 150.5, 50: 145.2 }
  error?: string;
  message?: string; // For informational messages like data update check
};

// --- Configuration ---
const DEFAULT_MA_PERIODS: number[] = [20, 50, 100, 200]; // Common MAs if 'n' isn't specified
// ---

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
): Promise<NextResponse<MovingAverageResponse>> {
  const { symbol: symbolParam } = await params;
  const symbol = symbolParam?.toUpperCase();

  const { searchParams } = new URL(request.url);
  const nParam = searchParams.get("n");

  // --- Input Validation ---
  if (!symbol) {
    return NextResponse.json(
      { symbol: "", error: "Symbol parameter is missing in the URL path." },
      { status: 400 }
    );
  }

  let specificN: number | null = null;
  if (nParam) {
    specificN = parseInt(nParam, 10);
    if (isNaN(specificN) || specificN <= 0) {
      return NextResponse.json(
        {
          symbol,
          error:
            'Invalid value for "n" query parameter. Must be a positive integer.',
        },
        { status: 400 }
      );
    }
  }
  // ---

  try {
    // --- Dependency Check & Data Update ---
    try {
      console.log(
        `[MovingAverage] Checking/Updating historical prices for ${symbol}...`
      );
      await getHistoricalPricesForSymbol(symbol);
      console.log(
        `[MovingAverage] Historical price check/update complete for ${symbol}.`
      );
    } catch (updateError: unknown) {
      // Use unknown for catch variable
      let errorMessage =
        "Failed dependency check: Could not ensure fresh historical prices.";
      if (updateError instanceof Error) {
        errorMessage = `Failed dependency check: ${updateError.message}`;
      }
      console.error(
        `[MovingAverage] Failed dependency check for ${symbol}:`,
        updateError
      );
      return NextResponse.json(
        { symbol, error: errorMessage },
        { status: 500 }
      );
    }
    // ---

    // --- Determine Calculation Needs ---
    const periodsToCalculate: number[] = specificN
      ? [specificN]
      : DEFAULT_MA_PERIODS;
    const maxPeriod = Math.max(...periodsToCalculate);
    const requiredDataPoints = maxPeriod;
    // ---

    // --- Fetch Data from Supabase ---
    console.log(
      `[MovingAverage] Fetching last ${requiredDataPoints} data points for ${symbol}...`
    );
    const supabase = getSupabaseServerClient(); // Assumes this returns SupabaseClient<Database>
    const { data: prices, error: dbError } = await supabase
      .from("historical_prices") // Correct table name
      .select("date, close") // Select only needed columns
      .eq("symbol", symbol)
      .order("date", { ascending: false })
      .limit(requiredDataPoints);

    if (dbError) {
      console.error(
        `[MovingAverage] Supabase DB Error fetching prices for ${symbol}:`,
        dbError
      );
      // Throwing here will be caught by the outer catch block
      throw new Error(`Supabase error: ${dbError.message}`);
    }

    // Use stricter typing based on select query - results are partial objects
    const typedPrices = prices as
      | Pick<HistoricalPrice, "date" | "close">[]
      | null;

    if (!typedPrices || typedPrices.length === 0) {
      return NextResponse.json(
        {
          symbol,
          error: `No historical data found for ${symbol} in the database.`,
        },
        { status: 404 }
      );
    }
    // ---

    // --- Calculate Moving Averages ---
    const latestPriceData = typedPrices[0];
    const calculatedMAs: { [period: number]: number } = {};

    console.log(
      `[MovingAverage] Calculating MAs for ${symbol}. Data points available: ${typedPrices.length}`
    );

    for (const period of periodsToCalculate) {
      if (typedPrices.length >= period) {
        const pricesForPeriod = typedPrices.slice(0, period);
        // Ensure 'close' is treated as a number, default to 0 if null/undefined
        const sum = pricesForPeriod.reduce(
          (acc, day) => acc + (day.close ?? 0),
          0
        );
        if (period > 0) {
          // Avoid division by zero, though already checked by specificN > 0
          calculatedMAs[period] = parseFloat((sum / period).toFixed(2));
        }
      } else {
        console.log(
          `[MovingAverage] Skipping ${period}-day MA for ${symbol}: Only ${typedPrices.length} data points available.`
        );
      }
    }
    // ---

    // --- Handle Insufficient Data Cases ---
    const latestCloseValue = latestPriceData.close
      ? parseFloat(latestPriceData.close.toFixed(2))
      : undefined;

    if (specificN && calculatedMAs[specificN] === undefined) {
      // Check if key exists
      return NextResponse.json(
        {
          symbol,
          latestDate: latestPriceData.date,
          latestClose: latestCloseValue,
          movingAverages: calculatedMAs,
          error: `Not enough data (${typedPrices.length} points) to calculate the requested ${specificN}-day moving average for ${symbol}. Required: ${specificN}.`,
        },
        { status: 400 }
      );
    }
    if (!specificN && Object.keys(calculatedMAs).length === 0) {
      return NextResponse.json(
        {
          symbol,
          latestDate: latestPriceData.date,
          latestClose: latestCloseValue,
          movingAverages: calculatedMAs,
          error: `Not enough data (${
            typedPrices.length
          } points) to calculate any default moving averages (${DEFAULT_MA_PERIODS.join(
            ", "
          )}) for ${symbol}. Minimum required: ${Math.min(
            ...DEFAULT_MA_PERIODS
          )}.`,
        },
        { status: 404 }
      );
    }
    // ---

    // --- Format and Return Successful Response ---
    const response: MovingAverageResponse = {
      symbol: symbol,
      latestDate: latestPriceData.date,
      latestClose: latestCloseValue,
      movingAverages: calculatedMAs,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: unknown) {
    // Use unknown for catch variable
    console.error(`[MovingAverage] General Error processing ${symbol}:`, error);
    let errorMessage = "Internal Server Error";
    // Type guard to safely access error properties
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    }
    // Provide the symbol in the error response if available
    const errorSymbol = typeof symbol === "string" ? symbol : "unknown symbol";
    return NextResponse.json(
      { symbol: errorSymbol, error: errorMessage },
      { status: 500 }
    );
  }
}
