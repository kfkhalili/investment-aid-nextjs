/* ──────────────────────────────────────────────────────────────────────
 * app/api/income-statements/route.ts
 * Handler for GET requests to /api/income-statements
 * Retrieves a list view of income statements.
 * ---------------------------------------------------------------------*/
import { NextResponse } from "next/server";

import { getAllIncomeStatements } from "@/lib/services/income-statements";
import type { IncomeStatement } from "@/lib/services/income-statements";

/**
 * Handles GET requests to fetch a list of income statements.
 * Uses the underlying service which may return projected data based on configuration.
 * In 'bySymbol' mode, this reads from the cache without triggering fetches.
 */
export async function GET(): Promise<
  NextResponse<Partial<IncomeStatement>[] | { error: string }>
> {
  console.log("GET /api/income-statements called");

  try {
    // Call the service function -> returns IncomeStatement[] (potentially partial if projected)
    const data: Partial<IncomeStatement>[] = await getAllIncomeStatements();

    // Return the data as JSON response
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching income statement list:", errorMessage, error);

    return NextResponse.json(
      { error: "Could not load income statements list." },
      { status: 500 } // Internal Server Error
    );
  }
}
