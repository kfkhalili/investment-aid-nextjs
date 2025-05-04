/* ──────────────────────────────────────────────────────────────────────
 * app/api/income-statements/[symbol]/route.ts
 * Handler for GET requests for a specific symbol.
 * Ensures profile exists first, then retrieves all OR the latest statement(s).
 * Use query parameter ?latest=true to get only the latest.
 * ---------------------------------------------------------------------*/
import { NextResponse } from "next/server";

// 1. Import service methods for BOTH profile and income statement
import { getProfile } from "@/api/profiles-supa/service";
import {
  getIncomeStatementsForSymbol,
  getLatestIncomeStatement,
} from "../service"; // Adjust path as needed (ensure this points to SUPABASE service index)

// 2. Import the API response type
import type { IncomeStatement } from "../service"; // Should be Supabase version

/**
 * Handles GET requests for a specific symbol.
 * Fetches all statements by default.
 * Fetches only the latest statement if query param `latest=true` is present.
 */
export async function GET(
  request: Request, // Use the request object to access URL
  // Correctly type params for App Router dynamic segments
  { params }: { params: Promise<{ symbol: string }> }
): Promise<
  NextResponse<
    Partial<IncomeStatement> | Partial<IncomeStatement>[] | { error: string }
  >
> {
  // Get and uppercase the symbol from the route parameters
  const { symbol: symbolParam } = await params;
  const symbol = symbolParam?.toUpperCase();

  // Check for query parameter
  const { searchParams } = new URL(request.url);
  const getLatestOnly = searchParams.get("latest") === "true";

  console.log(
    `GET /api/income-statements/${symbol} called ${
      getLatestOnly ? " (latest only)" : ""
    }`
  );

  if (!symbol) {
    return NextResponse.json(
      { error: "Symbol parameter is missing or invalid." },
      { status: 400 }
    );
  }

  try {
    // --- Step 1: Ensure Profile Exists (for Foreign Key Constraint) ---
    console.log(`Ensuring profile exists for ${symbol}...`);
    const profileData = await getProfile(symbol);

    // If profile doesn't exist after fetch attempt, the symbol might be invalid/unsupported
    if (!profileData) {
      console.log(`Profile dependency not found for symbol: ${symbol}`);
      return NextResponse.json(
        {
          error: `Data (or underlying profile) not found for symbol ${symbol}.`,
        },
        { status: 404 } // Not Found, as the symbol seems invalid
      );
    }
    console.log(`Profile check complete for ${symbol}.`);
    // --- End Step 1 ---

    // --- Step 2: Fetch Income Statement Data ---
    let data: Partial<IncomeStatement> | Partial<IncomeStatement>[] | null;

    if (getLatestOnly) {
      // --- Fetch Only Latest ---
      console.log(`Workspaceing latest income statement for ${symbol}...`);
      data = await getLatestIncomeStatement(symbol); // Calls service.getOne

      if (!data) {
        console.log(`Latest income statement not found for symbol: ${symbol}`);
        return NextResponse.json(
          {
            error: `Latest income statement data not found for symbol ${symbol}.`,
          },
          { status: 404 }
        );
      }
      // data is Partial<IncomeStatement>
    } else {
      // --- Fetch All History ---
      console.log(`Workspaceing all income statements for ${symbol}...`);
      data = await getIncomeStatementsForSymbol(symbol); // Calls service.getAllForSymbol

      // Return 200 OK with empty array if history exists but is empty for this symbol
      // (Don't return 404 here unless getAllForSymbol throws a specific 'not found' error)
      // if (data.length === 0) {
      //   console.log(`No income statement history found for symbol: ${symbol}`);
      //   return NextResponse.json(
      //     { error: `Income statement data not found for symbol ${symbol}` },
      //     { status: 404 }
      //   );
      // }
      // data is Partial<IncomeStatement>[]
    }

    // Return the data (either single object or array, both potentially partial)
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
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
        { status: 404 }
      );
    }
    // Don't specifically check for FK error here, as the profile check should prevent it.
    // If it still happens, it indicates another issue.

    // Return a generic server error response
    return NextResponse.json(
      { error: `Could not load income statements for symbol ${symbol}.` },
      { status: 500 }
    );
  }
}
