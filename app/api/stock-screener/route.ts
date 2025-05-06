/* ──────────────────────────────────────────────────────────────────────
 * app/api/stock-screener/route.ts
 * Handler for GET requests to /api/stock-screener
 * Retrieves the latest stock screener results list.
 * ---------------------------------------------------------------------*/
import { NextResponse } from "next/server";

import { getStockScreenerResults } from "@/lib/services/stocker-screener";
import type { StockScreenerItem } from "@/lib/services/stocker-screener";

/**
 * Handles GET requests to fetch the latest stock screener results.
 * Uses the underlying service which returns cached or freshly fetched data,
 * potentially projected/ordered based on configuration.
 */
export async function GET(): Promise<
  NextResponse<Partial<StockScreenerItem>[] | { error: string }> // Returns array of partials
> {
  console.log("GET /api/stock-screener called");

  try {
    // Call the service function -> returns Partial<StockScreenerApiItem>[]
    const data: Partial<StockScreenerItem>[] = await getStockScreenerResults();

    // Return the data as JSON response
    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    // Catch as unknown
    let errorMessage: string;
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    } else {
      errorMessage = "An unknown error occurred while fetching screener data.";
    }
    console.error("Error fetching stock screener list:", errorMessage, error);

    return NextResponse.json(
      { error: "Could not load stock screener results." },
      { status: 500 } // Internal Server Error
    );
  }
}

// You can add POST/PUT/DELETE handlers here if needed later.
