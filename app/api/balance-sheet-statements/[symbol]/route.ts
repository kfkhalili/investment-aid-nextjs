/* ──────────────────────────────────────────────────────────────────────
 * app/api/balance-sheet-statements/[symbol]/route.ts
 * Handler for GET requests for a specific symbol.
 * Ensures profile exists first, then retrieves all OR the latest statement(s).
 * Use query parameter ?latest=true to get only the latest.
 * ---------------------------------------------------------------------*/
import { NextResponse } from "next/server";

// 1. Import service methods for BOTH profile and balance sheet
import { getProfile } from "@/api/profiles/service";
import {
  getBalanceSheetStatementsForSymbol,
  getLatestBalanceSheetStatement,
} from "../service"; // Adjust path (ensure this points to SUPABASE service index)

// 2. Import the API response type
import type { BalanceSheetStatement } from "../service"; // Supabase version

/**
 * Handles GET requests.
 * Ensures profile exists first.
 * Fetches all statements by default.
 * Fetches only the latest statement if query param `latest=true` is present.
 */
export async function GET(
  request: Request, // Use the request object to access URL
  // Correct type for params in App Router dynamic segments
  { params }: { params: Promise<{ symbol: string }> }
): Promise<
  NextResponse<
    | Partial<BalanceSheetStatement>
    | Partial<BalanceSheetStatement>[]
    | { error: string }
  >
> {
  // Access symbol directly from params, uppercase it
  const { symbol: symbolParam } = await params;
  const symbol = symbolParam?.toUpperCase();

  // Check for query parameter
  const { searchParams } = new URL(request.url);
  const getLatestOnly = searchParams.get("latest") === "true"; // Check if ?latest=true

  console.log(
    `GET /api/balance-sheet-statements/${symbol} called ${
      getLatestOnly ? " (latest only)" : ""
    }`
  );

  if (!symbol) {
    return NextResponse.json(
      { error: "Symbol parameter is missing or invalid." }, // Updated message slightly
      { status: 400 }
    );
  }

  try {
    // --- Step 1: Ensure Profile Exists (for Foreign Key Constraint) ---
    console.log(`Ensuring profile exists for ${symbol}...`);
    const profileData = await getProfile(symbol); // Call profile service first

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

    // --- Step 2: Fetch Balance Sheet Data ---
    let data:
      | Partial<BalanceSheetStatement>
      | Partial<BalanceSheetStatement>[]
      | null;

    if (getLatestOnly) {
      // --- Fetch Only Latest ---
      console.log(`Fetching latest balance sheet for ${symbol}...`);
      data = await getLatestBalanceSheetStatement(symbol); // Returns single object or null

      if (!data) {
        console.log(`Latest balance sheet not found for symbol: ${symbol}`);
        return NextResponse.json(
          {
            error: `Latest balance sheet data not found for symbol ${symbol}.`,
          },
          { status: 404 }
        );
      }
      // data is Partial<BalanceSheetStatement>
    } else {
      // --- Fetch All History ---
      console.log(`Fetching all balance sheets for ${symbol}...`);
      data = await getBalanceSheetStatementsForSymbol(symbol); // Returns array

      // Return 200 OK with empty array if history exists but is empty.
      // if (data.length === 0) { ... optional 404 handling ... }
      // data is Partial<BalanceSheetStatement>[]
    }

    // Return the data (either single object or array)
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      `Error fetching balance sheets for ${symbol} (${
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
        { error: `Balance sheet data not found for symbol ${symbol}.` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: `Could not load balance sheet statements for symbol ${symbol}.`,
      },
      { status: 500 }
    );
  }
}
