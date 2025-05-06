/* ──────────────────────────────────────────────────────────────────────
 * app/api/earnings-calendar/route.ts
 * Handler for GET requests to /api/earnings-calendar
 * Retrieves the latest earnings calendar snapshot.
 * ---------------------------------------------------------------------*/
import { NextResponse } from "next/server";

import { getEarningsCalendar } from "@/lib/services/earnings-calendar";
import type { EarningsCalendarApiItem } from "@/lib/services/earnings-calendar";

/**
 * Handles GET requests to fetch the latest earnings calendar.
 * Uses the underlying service which returns cached or freshly fetched data,
 * potentially projected/ordered based on configuration.
 */
export async function GET(): Promise<
  NextResponse<Partial<EarningsCalendarApiItem>[] | { error: string }> // Returns array of partials
> {
  console.log("GET /api/earnings-calendar called");

  try {
    // Call the service function -> returns Partial<EarningsCalendarApiItem>[]
    const data: Partial<EarningsCalendarApiItem>[] =
      await getEarningsCalendar();

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

    console.error("Error fetching earnings calendar:", errorMessage, error);

    // Determine status code based on error type if possible
    let status = 500;
    if (errorMessage.includes("FMP request failed")) {
      status = 502;
    }
    // Add other checks if specific list errors are anticipated

    return NextResponse.json(
      { error: `Could not load earnings calendar. Reason: ${errorMessage}` },
      { status: status }
    );
  }
}
