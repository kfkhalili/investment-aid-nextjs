/* ──────────────────────────────────────────────────────────────────────
 * app/api/profile/[symbol]/route.ts // <-- Correct path
 * Handler for GET requests to /api/profile/[symbol]
 * Retrieves the company profile for a specific symbol.
 * ---------------------------------------------------------------------*/
import { NextResponse } from "next/server";

// 1. Import the specific service method for getting the profile
import { getProfile } from "../service"; // Use the exported getOne equivalent
// 2. Import the API response type
import type { Profile } from "../service"; // Import Profile type

/**
 * Handles GET requests to fetch the profile for a specific symbol.
 */
export async function GET(
  request: Request, // Keep request for potential future use (e.g., headers)
  { params }: { params: Promise<{ symbol: string }> }
): Promise<NextResponse<Partial<Profile> | { error: string }>> {
  // Return single Partial<Profile> or error
  // Get and uppercase the symbol from the route parameters

  const { symbol: symbolParam } = await params;
  const symbol = symbolParam?.toUpperCase();

  console.log(`GET /api/profile/${symbol} called`);

  if (!symbol) {
    return NextResponse.json(
      { error: "Symbol parameter is missing or invalid." },
      { status: 400 } // Bad Request
    );
  }

  try {
    // Call the service function to get the profile data for the symbol.
    // Service now returns Partial<Profile> | null
    const data: Partial<Profile> | null = await getProfile(symbol);

    // Handle case where the profile is not found (service returns null)
    if (!data) {
      console.log(`Profile not found for symbol: ${symbol}`);
      return NextResponse.json(
        { error: `Profile data not found for symbol ${symbol}.` },
        { status: 404 } // Not Found
      );
    }

    // Return the profile data (single partial object)
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    // Log the error for server-side debugging
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`Error fetching profile for ${symbol}:`, errorMessage, error);

    // Check for specific "not found" errors potentially thrown by the service layer
    if (
      errorMessage.includes("No data found for symbol") ||
      errorMessage.includes("FMP request failed (404)")
    ) {
      return NextResponse.json(
        { error: `Profile data not found for symbol ${symbol}.` },
        { status: 404 } // Not Found
      );
    }

    // Return a generic server error response for other issues
    return NextResponse.json(
      { error: `Could not load profile for symbol ${symbol}.` },
      { status: 500 } // Internal Server Error
    );
  }
}
