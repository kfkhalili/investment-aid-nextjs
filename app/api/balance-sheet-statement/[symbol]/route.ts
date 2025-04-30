/* ──────────────────────────────────────────────────────────────────────
 * app/api/balance-sheet-statement/[symbol]/route.ts
 * Handler for GET requests to /api/balance-sheet-statement/[symbol]
 * Retrieves all OR the latest annual balance sheet statement(s) for a specific symbol.
 * Use query parameter ?latest=true to get only the latest.
 * ---------------------------------------------------------------------*/
import { NextResponse } from "next/server";

// 1. Import BOTH service methods
import {
  getBalanceSheetStatementsForSymbol,
  getLatestBalanceSheetStatement,
} from "@/api/balance-sheet-statement/service";
// 2. Import the API response type
import type { BalanceSheetStatement } from "@/api/balance-sheet-statement/service";

/**
 * Handles GET requests.
 * Fetches all statements by default.
 * Fetches only the latest statement if query param `latest=true` is present.
 */
export async function GET(
  request: Request, // Use the request object to access URL
  { params }: { params: Promise<{ symbol: string }> }
): Promise<
  NextResponse<
    BalanceSheetStatement | BalanceSheetStatement[] | { error: string }
  >
> {
  // Update return type
  const { symbol: symbolParam } = await params;
  const symbol = symbolParam?.toUpperCase();

  // --- Check for query parameter ---
  // Use URL constructor to easily parse query params
  const { searchParams } = new URL(request.url);
  const getLatestOnly = searchParams.get("latest") === "true"; // Check if ?latest=true

  console.log(
    `GET /api/balance-sheet-statement/${symbol} called ${
      getLatestOnly ? " (latest only)" : ""
    }`
  );

  if (!symbol) {
    return NextResponse.json(
      { error: "Symbol parameter is missing." },
      { status: 400 }
    );
  }

  try {
    let data: BalanceSheetStatement | BalanceSheetStatement[] | null;

    if (getLatestOnly) {
      // --- Fetch Only Latest ---
      console.log(`Fetching latest balance sheet for ${symbol}...`);
      data = await getLatestBalanceSheetStatement(symbol); // Returns single object or null

      // Handle case where the single latest record is not found
      if (!data) {
        console.log(`Latest balance sheet not found for symbol: ${symbol}`);
        return NextResponse.json(
          {
            error: `Latest balance sheet data not found for symbol ${symbol}.`,
          },
          { status: 404 }
        );
      }
    } else {
      // --- Fetch All History ---
      console.log(`Fetching all balance sheets for ${symbol}...`);
      data = await getBalanceSheetStatementsForSymbol(symbol); // Returns array

      // Optional: Handle empty array for history - could mean no data exists at all
      // if (data.length === 0) {
      //      console.log(`No balance sheet history found for symbol: ${symbol}`);
      //      return NextResponse.json({ error: `No balance sheet data found for symbol ${symbol}` }, { status: 404 });
      // }
    }

    // Return the data (either single object or array)
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    // Log the error for server-side debugging
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      `Error fetching balance sheets for ${symbol} (${
        getLatestOnly ? "latest only" : "all"
      }):`,
      errorMessage,
      error
    );

    // Check for specific "not found" errors potentially thrown by the service layer
    // (e.g., if internalFetchAndUpsert throws on FMP 404 or no data)
    if (
      errorMessage.includes("No data found for symbol") ||
      errorMessage.includes("FMP request failed (404)")
    ) {
      return NextResponse.json(
        { error: `Balance sheet data not found for symbol ${symbol}.` },
        { status: 404 } // Not Found
      );
    }

    // Return a generic server error response for other issues
    return NextResponse.json(
      {
        error: `Could not load balance sheet statements for symbol ${symbol}.`,
      },
      { status: 500 } // Internal Server Error
    );
  }
}
