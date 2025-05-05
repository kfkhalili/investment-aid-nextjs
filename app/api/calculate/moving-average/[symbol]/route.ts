// app/api/calculate/moving-average/[symbol]/route.ts

import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient"; // Adjust path if needed
import { getHistoricalPricesForSymbol } from "@/api/historical-price/service"; // Adjust path if needed
import type { Database } from "@/lib/supabase/database.types"; // Adjust path if needed

// Define the shape of the data coming from your table using generated types
type HistoricalPrice = Database["public"]["Tables"]["historical_prices"]["Row"];

// Define the response structure (Removed 'message' field as per previous request)
type MovingAverageResponse = {
  symbol: string;
  latestDate?: string; // Will be the requested date if provided and found
  latestClose?: number;
  movingAverages?: { [period: number]: number }; // e.g., { 20: 150.5, 50: 145.2 }
  error?: string;
};

// --- Configuration ---
const DEFAULT_MA_PERIODS: number[] = [20, 50, 100, 200];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/; // Basic YYYY-MM-DD format validation
// ---

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
): Promise<NextResponse<MovingAverageResponse>> {
  const { symbol: symbolParam } = await params;
  const symbol = symbolParam?.toUpperCase();

  const { searchParams } = new URL(request.url);
  const nParam = searchParams.get("n");
  const dateParam = searchParams.get("date"); // Get optional date parameter

  // --- Input Validation ---
  if (!symbol) {
    // Should technically not happen if file structure is correct
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

  let targetDate: string | null = null;
  if (dateParam) {
    if (!DATE_REGEX.test(dateParam)) {
      return NextResponse.json(
        { symbol, error: 'Invalid "date" parameter format. Use YYYY-MM-DD.' },
        { status: 400 }
      );
    }
    targetDate = dateParam; // Use the validated date string
  }
  // ---

  try {
    // --- Dependency Check & Data Update ---
    // Keep this check to ensure the database is generally up-to-date
    try {
      console.log(
        `[MovingAverage] Checking/Updating historical prices for ${symbol}...`
      );
      await getHistoricalPricesForSymbol(symbol);
      console.log(
        `[MovingAverage] Historical price check/update complete for ${symbol}.`
      );
    } catch (updateError: unknown) {
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

    // --- Fetch Data from Supabase (Modified Query) ---
    console.log(
      `[MovingAverage] Fetching last ${requiredDataPoints} data points for ${symbol} up to ${
        targetDate ?? "latest"
      }...`
    );
    const supabase = getSupabaseServerClient();
    // Start building the query
    let query = supabase
      .from("historical_prices")
      .select("date, close")
      .eq("symbol", symbol);

    // Apply date filter *only* if targetDate is specified
    if (targetDate) {
      query = query.lte("date", targetDate); // Filter records on or before the target date
    }

    // Apply ordering and limit to the potentially filtered query
    query = query
      .order("date", { ascending: false }) // Still need latest first (up to targetDate)
      .limit(requiredDataPoints);

    // Execute the query
    const { data: prices, error: dbError } = await query;

    if (dbError) {
      console.error(
        `[MovingAverage] Supabase DB Error fetching prices for ${symbol}:`,
        dbError
      );
      throw new Error(`Supabase error: ${dbError.message}`);
    }

    const typedPrices = prices as
      | Pick<HistoricalPrice, "date" | "close">[]
      | null;

    if (!typedPrices || typedPrices.length === 0) {
      return NextResponse.json(
        {
          symbol,
          error: `No historical data found for ${symbol}${
            targetDate ? ` on or before ${targetDate}` : ""
          }.`,
        },
        { status: 404 }
      );
    }
    // ---

    // --- Validate Target Date Found (if specified) ---
    const latestPriceData = typedPrices[0]; // This is the record for the targetDate (or actual latest)

    if (targetDate && latestPriceData.date !== targetDate) {
      // No data found for the *exact* requested date, even though older data exists.
      return NextResponse.json(
        {
          symbol,
          error: `No data found for the specific date ${targetDate}. The most recent data available on or before this date is ${latestPriceData.date}.`,
        },
        { status: 404 }
      );
    }
    // ---

    // --- Calculate Moving Averages ---
    const calculatedMAs: { [period: number]: number } = {};

    console.log(
      `[MovingAverage] Calculating MAs for ${symbol} ending ${latestPriceData.date}. Data points available for calc: ${typedPrices.length}`
    );

    for (const period of periodsToCalculate) {
      // Check if enough data points *ending on the target date* were returned
      if (typedPrices.length >= period) {
        const pricesForPeriod = typedPrices.slice(0, period);
        const sum = pricesForPeriod.reduce(
          (acc, day) => acc + (day.close ?? 0),
          0
        );
        if (period > 0) {
          calculatedMAs[period] = parseFloat((sum / period).toFixed(2));
        }
      } else {
        console.log(
          `[MovingAverage] Skipping ${period}-day MA for ${symbol}: Only ${typedPrices.length} data points available up to ${latestPriceData.date}.`
        );
      }
    }
    // ---

    // --- Handle Insufficient Data Cases ---
    const latestCloseValue = latestPriceData.close
      ? parseFloat(latestPriceData.close.toFixed(2))
      : undefined;

    if (specificN && calculatedMAs[specificN] === undefined) {
      return NextResponse.json(
        {
          symbol,
          latestDate: latestPriceData.date,
          latestClose: latestCloseValue,
          movingAverages: calculatedMAs,
          error: `Not enough data (${typedPrices.length} points) available up to ${latestPriceData.date} to calculate the requested ${specificN}-day moving average for ${symbol}. Required: ${specificN}.`,
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
          } points) available up to ${
            latestPriceData.date
          } to calculate any default moving averages (${DEFAULT_MA_PERIODS.join(
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
      latestDate: latestPriceData.date, // Date will be targetDate if provided and found
      latestClose: latestCloseValue,
      movingAverages: calculatedMAs,
      // No message field included
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: unknown) {
    console.error(`[MovingAverage] General Error processing ${symbol}:`, error);
    let errorMessage = "Internal Server Error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    }
    const errorSymbol = typeof symbol === "string" ? symbol : "unknown symbol";
    return NextResponse.json(
      { symbol: errorSymbol, error: errorMessage },
      { status: 500 }
    );
  }
}
