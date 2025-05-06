/* ──────────────────────────────────────────────────────────────────────
 * app/api/cash-flow-statements/[symbol]/route.ts (Supabase Version)
 * Handler for GET requests for a specific symbol's cash flow statements.
 * Ensures profile exists first, then retrieves all OR the latest statement(s).
 * Use query parameter ?latest=true to get only the latest.
 * ---------------------------------------------------------------------*/
import { NextResponse } from "next/server";

import { getProfile } from "@/lib/services/profiles";
import {
  getCashFlowStatementsForSymbol,
  getLatestCashFlowStatement,
} from "@/lib/services/cash-flow-statements";

// 2. Import the API response type
import type { CashFlowStatement } from "@/lib/services/cash-flow-statements";

/**
 * Handles GET requests for a specific symbol's cash flow statements.
 * Ensures profile exists first.
 * Fetches all statements by default.
 * Fetches only the latest statement if query param `latest=true` is present.
 */
export async function GET(
  request: Request, // Use the request object to access URL
  { params }: { params: Promise<{ symbol: string }> }
): Promise<
  NextResponse<
    | Partial<CashFlowStatement> // Single result type
    | Partial<CashFlowStatement>[] // Array result type
    | { error: string } // Error type
  >
> {
  // Get symbol directly from params and uppercase it
  const { symbol: symbolParam } = await params;
  const symbol = symbolParam?.toUpperCase();

  // --- Check for query parameter ---
  const { searchParams } = new URL(request.url);
  const getLatestOnly = searchParams.get("latest") === "true";

  console.log(
    `GET /api/cash-flow-statements/${symbol} called ${
      // Corrected log path
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
    // --- Step 1: Ensure Profile Exists (for Foreign Key Constraint) ---
    console.log(`Ensuring profile exists for ${symbol}...`);
    const profileData = await getProfile(symbol); // Call profile service

    // If profile doesn't exist after fetch attempt, symbol might be invalid
    if (!profileData) {
      console.log(`Profile dependency not found for symbol: ${symbol}`);
      return NextResponse.json(
        {
          error: `Data (or underlying profile) not found for symbol ${symbol}.`,
        },
        { status: 404 } // Not Found
      );
    }
    console.log(`Profile check complete for ${symbol}.`);
    // --- End Step 1 ---

    // --- Step 2: Fetch Cash Flow Statement Data ---
    let data: Partial<CashFlowStatement> | Partial<CashFlowStatement>[] | null;

    if (getLatestOnly) {
      // --- Fetch Only Latest ---
      console.log(`Fetching latest cash flow statement for ${symbol}...`); // Updated log
      data = await getLatestCashFlowStatement(symbol); // Use correct function

      if (!data) {
        console.log(
          `Latest cash flow statement not found for symbol: ${symbol}`
        ); // Updated log
        return NextResponse.json(
          {
            error: `Latest cash flow statement data not found for symbol ${symbol}.`,
          }, // Updated error
          { status: 404 }
        );
      }
      // data is Partial<CashFlowStatement> | null (but non-null here)
    } else {
      // --- Fetch All History ---
      console.log(`Fetching all cash flow statements for ${symbol}...`); // Updated log
      data = await getCashFlowStatementsForSymbol(symbol); // Use correct function

      // Return 200 OK with empty array if history is empty for this symbol.
      // No need for a 404 here unless the service throws one.
      // data is Partial<CashFlowStatement>[]
    }

    // Return the data
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      `Error fetching cash flow statements for ${symbol} (${
        // Updated log
        getLatestOnly ? "latest only" : "all"
      }):`,
      errorMessage,
      error
    );

    if (
      errorMessage.includes("No data found for symbol") ||
      errorMessage.includes("FMP request failed (404)")
    ) {
      return NextResponse.json(
        { error: `Cash flow statement data not found for symbol ${symbol}.` }, // Updated error
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: `Could not load cash flow statements for symbol ${symbol}.` }, // Updated error
      { status: 500 }
    );
  }
}
