/* ──────────────────────────────────────────────────────────────────────
 * app/api/grades-consensus/[symbol]/route.ts (Supabase Version)
 * Handler for GET requests to fetch grades consensus data for a symbol.
 * Accepts optional 'date' query parameter (YYYY-MM-DD).
 * Ensures profile exists first.
 * ---------------------------------------------------------------------*/
import { NextResponse } from "next/server";
import { isValid, parseISO } from "date-fns"; // Using date-fns for validation

// 1. Import service methods for Profile AND Grades Consensus
import { getProfile } from "@/api/profiles/service"; // Adjust path
import {
  getLatestGradesConsensus,
  getGradesConsensusForDateAndSymbol, // Import BOTH service functions
} from "../service"; // Adjust path

// 2. Import the API response type
import type { GradesConsensusApiItem } from "../service"; // Supabase version

// --- Type Guard for Potential Error Structure ---
function errorHasCode(
  error: unknown
): error is { code: string; [key: string]: unknown } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  );
}

/**
 * Handles GET requests to fetch grades consensus data for a specific symbol.
 * If 'date' query param (YYYY-MM-DD) is provided, fetches for that date.
 * Otherwise, fetches the latest snapshot.
 * Ensures profile exists first.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
): Promise<NextResponse<Partial<GradesConsensusApiItem> | { error: string }>> {
  const { symbol: symbolParam } = await params;
  const symbol = symbolParam.toUpperCase();

  // --- Parse Query Parameters ---
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date"); // Get optional 'date' parameter
  let targetDate: string | undefined = undefined;

  // Validate date format if provided
  if (dateParam) {
    const parsedDate = parseISO(dateParam); // Attempt to parse YYYY-MM-DD
    if (isValid(parsedDate) && dateParam.match(/^\d{4}-\d{2}-\d{2}$/)) {
      targetDate = dateParam; // Use valid date string
      console.log(`[Grades Route] Request for specific date: ${targetDate}`);
    } else {
      console.warn(
        `[Grades Route] Invalid date parameter received: ${dateParam}. Fetching latest instead.`
      );
      // Optional: Return bad request if date format is mandatory when provided
      // return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD." }, { status: 400 });
    }
  }

  console.log(
    `GET /api/grades-consensus/${symbol} called ${
      targetDate ? `(date: ${targetDate})` : "(latest)"
    }`
  );

  if (!symbol) {
    return NextResponse.json(
      { error: "Symbol parameter is missing or invalid." },
      { status: 400 }
    );
  }

  try {
    // --- Step 1: Ensure Profile Exists ---
    console.log(`[Grades Route] Ensuring profile exists for ${symbol}...`);
    const profileData = await getProfile(symbol);
    if (!profileData) {
      console.log(`[Grades Route] Profile dependency not found for ${symbol}`);
      return NextResponse.json(
        {
          error: `Data (or underlying profile) not found for symbol ${symbol}.`,
        },
        { status: 404 }
      );
    }
    console.log(`[Grades Route] Profile check complete for ${symbol}.`);
    // --- End Step 1 ---

    // --- Step 2: Fetch Grades Consensus Data (Conditional) ---
    let data: Partial<GradesConsensusApiItem> | null;

    if (targetDate) {
      // Fetch for specific date using the new service function
      console.log(
        `[Grades Route] Fetching grades consensus for ${symbol} on ${targetDate}...`
      );
      data = await getGradesConsensusForDateAndSymbol(symbol, targetDate);
    } else {
      // Fetch the latest using the existing service function
      console.log(
        `[Grades Route] Fetching latest grades consensus for ${symbol}...`
      );
      data = await getLatestGradesConsensus(symbol);
    }

    // Handle case where data is not found for the specific date or latest
    if (!data) {
      const notFoundMessage = targetDate
        ? `Grades consensus data not found for symbol ${symbol} on date ${targetDate}.`
        : `Latest grades consensus data not found for symbol ${symbol}.`;
      console.log(`[Grades Route] ${notFoundMessage}`);
      return NextResponse.json({ error: notFoundMessage }, { status: 404 });
    }

    // Return the data
    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    // --- Type-Safe Error Handling (same as before) ---
    let errorMessage: string;
    let errorCode: string | undefined = undefined;
    if (error instanceof Error) {
      errorMessage = error.message;
      if (errorHasCode(error)) {
        errorCode = error.code;
      }
    } else if (typeof error === "string") {
      errorMessage = error;
    } else if (errorHasCode(error)) {
      errorCode = error.code;
      if ("message" in error && typeof error.message === "string") {
        errorMessage = error.message;
      } else {
        errorMessage = `Error with code ${errorCode}`;
      }
    } else {
      try {
        errorMessage = JSON.stringify(error);
      } catch {
        errorMessage = "An unknown error occurred.";
      }
    }
    console.error(
      `[Grades Route] Error fetching grades consensus for ${symbol}:`,
      errorMessage,
      error
    );
    let status = 500;
    if (errorMessage.includes("not found") || errorCode === "PGRST116") {
      status = 404;
    } else if (errorCode?.startsWith("22") || errorCode?.startsWith("23")) {
      status = 400;
    } else if (errorMessage.includes("FMP request failed")) {
      status = 502;
    }
    return NextResponse.json(
      {
        error: `Could not load grades consensus for symbol ${symbol}. Reason: ${errorMessage}`,
      },
      { status: status }
    );
  }
}
