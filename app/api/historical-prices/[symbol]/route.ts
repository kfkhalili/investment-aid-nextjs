/* ──────────────────────────────────────────────────────────────────────
 * app/api/historical-prices/[symbol]/route.ts
 * Handler for GET requests to fetch historical price data for a symbol.
 * Ensures profile exists before fetching historical data.
 * ---------------------------------------------------------------------*/
import { NextResponse } from "next/server";

import { getProfile } from "@/lib/services/profiles";
import { getHistoricalPricesForSymbol } from "@/lib/services/historical-prices";
import type { HistoricalPriceRow } from "@/lib/services/historical-prices";

// Optional: Import common helpers if needed for final shaping/ordering
// import { historicalPriceKeyOrder } from '../service/constants';
// import { reorderAndFilterObjectKeys } from '@/api/common/supabase';

// --- Type Guard for Potential Error Structure ---
// Checks if an unknown error has a 'code' property that is a string
function errorHasCode(
  error: unknown
): error is { code: string; [key: string]: unknown } {
  // Allow other props
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  );
}

/**
 * Handles GET requests to fetch historical price data for a specific symbol.
 * Ensures profile exists first.
 */
export async function GET(
  request: Request, // Keep request for potential future use
  { params }: { params: Promise<{ symbol: string }> }
): Promise<NextResponse<HistoricalPriceRow[] | { error: string }>> {
  // Returns array of Row type

  // Access symbol directly from params, uppercase it
  const { symbol: symbolParam } = await params;
  const symbol = symbolParam?.toUpperCase();

  console.log(`GET /api/historical-price/${symbol} called`);

  if (!symbol) {
    return NextResponse.json(
      { error: "Symbol parameter is missing or invalid." },
      { status: 400 }
    );
  }

  try {
    // --- Step 1: Ensure Profile Exists (for Foreign Key Constraint) ---
    console.log(`[HistPrice Route] Ensuring profile exists for ${symbol}...`);
    const profileData = await getProfile(symbol); // Call profile service

    if (!profileData) {
      console.log(
        `[HistPrice Route] Profile dependency not found for symbol: ${symbol}`
      );
      return NextResponse.json(
        {
          error: `Data (or underlying profile) not found for symbol ${symbol}.`,
        },
        { status: 404 } // Not Found
      );
    }
    console.log(`[HistPrice Route] Profile check complete for ${symbol}.`);
    // --- End Step 1 ---

    // --- Step 2: Fetch Historical Price Data ---
    console.log(
      `[HistPrice Route] Fetching historical prices for ${symbol}...`
    );
    // Call the dedicated service function which handles caching/fetching/upserting
    const data: HistoricalPriceRow[] = await getHistoricalPricesForSymbol(
      symbol
    );

    // Optional: Reorder/filter if needed before sending response
    // const orderedData = data.map(item => reorderAndFilterObjectKeys(item, historicalPriceKeyOrder));
    // return NextResponse.json(orderedData, { status: 200 });

    // Return the data directly from the service (service returns HistoricalPriceRow[])
    // Note: If the service returned Partial<ApiType>, you'd use that type here.
    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    // <-- Catch as unknown
    // --- Type-Safe Error Handling ---
    let errorMessage: string;
    let errorCode: string | undefined = undefined; // Variable to store potential code

    if (error instanceof Error) {
      errorMessage = error.message; // Safely access message
      // Check if it might also have a code property (e.g., from Supabase error wrapping)
      if (errorHasCode(error)) {
        errorCode = error.code;
      }
    } else if (typeof error === "string") {
      errorMessage = error;
    } else if (errorHasCode(error)) {
      // If it's not an Error instance but has a code property
      errorCode = error.code;
      // --- FIX: Safely check for message property ---
      if ("message" in error && typeof error.message === "string") {
        errorMessage = error.message;
      } else {
        errorMessage = `Error with code ${errorCode}`; // Fallback if no message property
      }
      // --- END FIX ---
    } else {
      // Attempt to stringify other error types
      try {
        errorMessage = JSON.stringify(error);
      } catch {
        errorMessage =
          "An unknown error occurred while fetching historical prices.";
      }
    }
    // --- End Type-Safe Error Handling ---

    console.error(
      `[HistPrice Route] Error fetching historical prices for ${symbol}:`,
      errorMessage,
      error
    ); // Log original error too

    // Determine status code based on error type if possible
    let status = 500; // Default to Internal Server Error
    if (
      errorMessage.includes("not found") ||
      errorCode === "PGRST116" /* Not found via single() */
    ) {
      status = 404;
    } else if (
      errorCode?.startsWith("22") ||
      errorCode?.startsWith("23") /* DB Constraint/Syntax/FK */
    ) {
      status = 400; // Bad request for data/constraint issues
    } else if (errorMessage.includes("FMP request failed")) {
      status = 502; // Bad Gateway if FMP fails
    }

    return NextResponse.json(
      {
        error: `Could not load historical prices for symbol ${symbol}. Reason: ${errorMessage}`,
      },
      { status: status }
    );
  }
}
