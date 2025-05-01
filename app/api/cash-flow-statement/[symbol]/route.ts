/* ──────────────────────────────────────────────────────────────────────
 * app/api/income-statements/[symbol]/route.ts
 * Handler for GET requests to /api/income-statements/[symbol]
 * Retrieves all OR the latest annual income statement(s) for a specific symbol.
 * Use query parameter ?latest=true to get only the latest.
 * ---------------------------------------------------------------------*/
import { NextResponse } from "next/server";

// 1. Import BOTH relevant service methods
import {
  getCashFlowStatementsForSymbol,
  getLatestCashFlowStatement, // Import getOne equivalent
} from "../service";
// 2. Import the API response type
import type { CashFlowStatement } from "../service";

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
    | Partial<CashFlowStatement>
    | Partial<CashFlowStatement>[]
    | { error: string }
  >
> {
  // Unified return type

  // Use the corrected pattern for accessing and transforming params safely with const
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol?.toUpperCase();

  // --- Check for query parameter ---
  const { searchParams } = new URL(request.url);
  const getLatestOnly = searchParams.get("latest") === "true"; // Check if ?latest=true

  console.log(
    `GET /api/income-statements/${symbol} called ${
      getLatestOnly ? " (latest only)" : ""
    }`
  );

  if (!symbol) {
    return NextResponse.json(
      { error: "Symbol parameter is missing or invalid." },
      { status: 400 } // Bad Request
    );
  }

  try {
    // Declare data variable type based on the unified response possibilities
    let data: Partial<CashFlowStatement> | Partial<CashFlowStatement>[] | null;

    if (getLatestOnly) {
      // --- Fetch Only Latest ---
      console.log(`Fetching latest income statement for ${symbol}...`);
      data = await getLatestCashFlowStatement(symbol); // Calls service.getOne

      // Handle case where the single latest record is not found (service.getOne returns null)
      if (!data) {
        console.log(`Latest income statement not found for symbol: ${symbol}`);
        return NextResponse.json(
          {
            error: `Latest income statement data not found for symbol ${symbol}.`,
          },
          { status: 404 }
        );
      }
      // 'data' is type IncomeStatement here
    } else {
      // --- Fetch All History ---
      console.log(`Fetching all income statements for ${symbol}...`);
      data = await getCashFlowStatementsForSymbol(symbol); // Calls service.getAllForSymbol

      // If getAllForSymbol returns empty array (after ensuring freshness), treat as 404
      if (data.length === 0) {
        console.log(`No income statement history found for symbol: ${symbol}`);
        return NextResponse.json(
          { error: `Income statement data not found for symbol ${symbol}` },
          { status: 404 }
        );
      }
      // 'data' is type IncomeStatement[] here
    }

    // Return the data (either single object or array)
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    // Log the error for server-side debugging
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      `Error fetching income statements for ${symbol} (${
        getLatestOnly ? "latest only" : "all"
      }):`,
      errorMessage,
      error
    );

    // Check for specific "not found" errors potentially thrown by the service layer
    if (
      errorMessage.includes("No data found for symbol") ||
      errorMessage.includes("FMP request failed (404)")
    ) {
      return NextResponse.json(
        { error: `Income statement data not found for symbol ${symbol}.` },
        { status: 404 } // Not Found
      );
    }

    // Return a generic server error response for other issues
    return NextResponse.json(
      { error: `Could not load income statements for symbol ${symbol}.` },
      { status: 500 } // Internal Server Error
    );
  }
}
