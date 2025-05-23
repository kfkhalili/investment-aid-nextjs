/* ──────────────────────────────────────────────────────────────────────
 * app/api/balance-sheet-statements/route.ts
 * Handler for GET requests to /api/balance-sheet-statement
 * Retrieves a list view of balance sheet statements.
 * ---------------------------------------------------------------------*/
import { NextResponse } from "next/server";

import { getAllBalanceSheetStatements } from "@/lib/services/balance-sheet-statements";
import type { BalanceSheetStatement } from "@/lib/services/balance-sheet-statements";

/**
 * Handles GET requests to fetch a list of balance sheet statements.
 * Uses the underlying service which may return projected data based on configuration.
 */
export async function GET(): Promise<
  NextResponse<Partial<BalanceSheetStatement>[] | { error: string }>
> {
  console.log("GET /api/balance-sheet-statement called");

  try {
    // Call the service function to get the data.
    // This function already handles mapping to the BalanceSheetStatement type.
    const data: Partial<BalanceSheetStatement>[] =
      await getAllBalanceSheetStatements();

    // Return the data as JSON response
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    // Log the error for server-side debugging
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching balance sheet list:", errorMessage, error);

    // Return a generic error response to the client
    return NextResponse.json(
      { error: "Could not load balance sheet statements list." },
      { status: 500 } // Internal Server Error
    );
  }
}
