/* ──────────────────────────────────────────────────────────────────────
 * app/api/grades-consensus/route.ts (Supabase Version)
 * Handler for GET requests to /api/grades-consensus
 * Retrieves a list view of the latest grades consensus for all symbols.
 * ---------------------------------------------------------------------*/
import { NextResponse } from "next/server";

// 1. Import the specific service method for getting the list view
import { getAllLatestGradesConsensus } from "./service"; // Adjust path

// 2. Import the API response type
import type { GradesConsensusApiItem } from "./service"; // Supabase version

/**
 * Handles GET requests to fetch a list of the latest grades consensus for all symbols.
 * Uses the underlying service which returns cached or freshly fetched data,
 * potentially projected/ordered based on configuration.
 */
export async function GET(): Promise<
  NextResponse<Partial<GradesConsensusApiItem>[] | { error: string }> // Returns array of partials
> {
  console.log("GET /api/grades-consensus called");

  try {
    // Call the service function -> returns Partial<GradesConsensusApiItem>[]
    // This fetches the latest snapshot for each symbol based on the service logic
    const data: Partial<GradesConsensusApiItem>[] =
      await getAllLatestGradesConsensus();

    // Return the data as JSON response
    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    // Catch as unknown
    // --- Type-Safe Error Handling ---
    let errorMessage: string;
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    } else {
      try {
        errorMessage = JSON.stringify(error);
      } catch {
        errorMessage = "An unknown error occurred.";
      }
    }
    // --- End Type-Safe Error Handling ---

    console.error("Error fetching grades consensus list:", errorMessage, error);

    // Determine status code based on error type if possible (less specific here)
    let status = 500;
    if (errorMessage.includes("FMP request failed")) {
      status = 502;
    }
    // Add other checks if specific list errors are anticipated

    return NextResponse.json(
      {
        error: `Could not load grades consensus list. Reason: ${errorMessage}`,
      },
      { status: status }
    );
  }
}
