/* ──────────────────────────────────────────────────────────────────────
 * app/api/historical-prices/route.ts
 * Handler for GET requests to fetch historical price data for ALL symbols
 * for a specific date. Uses the dedicated service function.
 * Accepts a 'date' query parameter (YYYY-MM-DD), defaults to today (2025-05-06).
 * ---------------------------------------------------------------------*/
import { NextResponse } from "next/server";
// Import the new service function via your service index file
import { getHistoricalPricesForAllSymbolsByDate } from "@/lib/services/historical-prices";
// Import the type via your service index file
import type { HistoricalPriceRow } from "@/lib/services/historical-prices";

// Helper to get today's date in YYYY-MM-DD format (UTC)
function getTodayDateString(): string {
  // As per current context, today is May 6, 2025
  return "2025-05-06";
  // For a truly dynamic "today":
  // return new Date().toISOString().split("T")[0];
}

/**
 * Handles GET requests to fetch historical price data for all symbols
 * for a given date from the Supabase database.
 * Example: /api/historical-price?date=2025-05-01
 * If no date is provided, it defaults to the current date (2025-05-06).
 */
export async function GET(
  request: Request
): Promise<NextResponse<HistoricalPriceRow[] | { error: string }>> {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  let targetDate: string;

  const routePath = "/api/historical-price"; // For logging context
  console.log(`GET ${routePath} called with dateParam: ${dateParam}`);

  if (dateParam) {
    // Validate YYYY-MM-DD format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return NextResponse.json(
        { error: "Invalid date format. Please use YYYY-MM-DD." },
        { status: 400 }
      );
    }
    targetDate = dateParam;
  } else {
    targetDate = getTodayDateString();
    console.log(
      `No date parameter provided for ${routePath}, defaulting to: ${targetDate}`
    );
  }

  try {
    // Call the new service function
    const data: HistoricalPriceRow[] =
      await getHistoricalPricesForAllSymbolsByDate(targetDate);

    // The service function returns an empty array if no records are found.
    console.log(
      `[Route ${routePath}] Successfully retrieved ${data.length} records for date ${targetDate}.`
    );
    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    let errorMessage =
      "An unknown error occurred while fetching historical prices by date.";
    // Basic error message extraction
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    } else {
      try {
        errorMessage = JSON.stringify(error);
      } catch {
        /* fallback to default message */
      }
    }

    console.error(
      `[Route ${routePath}] Error fetching all historical prices for date ${targetDate}:`,
      errorMessage,
      // Log the original error object if it might contain more details (like stack trace)
      error
    );

    // For errors originating from the service (likely DB errors), a 500 is appropriate.
    return NextResponse.json(
      {
        error: `Could not load historical prices for date ${targetDate}. Reason: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
