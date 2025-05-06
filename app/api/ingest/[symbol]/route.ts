// app/api/fetch/[symbol]/route.ts
import { NextResponse } from "next/server";
import { processSymbolData } from "@/lib/services/ingest";
import type { SymbolProcessingResult } from "@/lib/services/ingest";

export async function GET(
  request: Request, // Keep for standard signature
  { params }: { params: Promise<{ symbol: string }> }
): Promise<NextResponse> {
  const { symbol: symbolParam } = await params;
  const symbol = symbolParam?.toUpperCase();

  console.log(
    `[API FetchData/${symbol}] Received request to fetch all data for symbol: ${symbol}`
  );

  try {
    // Call the service function to process data for the single symbol
    const result: SymbolProcessingResult = await processSymbolData(symbol);

    // Construct the response based on the service result
    const responsePayload: {
      message: string;
      symbol: string;
      status: string;
      details?: typeof result.details; // Make details optional in payload
      error?: string;
    } = {
      message: "", // To be set
      symbol: result.symbol,
      status: result.status,
      details: result.details,
    };

    let httpStatus: number = 200;

    switch (result.status) {
      case "Success":
        responsePayload.message = `Successfully fetched all data for symbol ${result.symbol}.`;
        break;
      case "Failed":
        responsePayload.message = `Failed to fetch some data for symbol ${result.symbol}. Check details.`;
        responsePayload.error =
          result.error || "One or more data fetches failed.";
        // Potentially still a 200 if some data was fetched, or 500 if it's a critical failure pattern
        // For now, let's keep 200 if details are present, otherwise 500.
        // If profile failed, it's handled by Profile_Fetch_Failed.
        // This 'Failed' means profile was OK, but other things failed.
        break;
      case "Profile_Fetch_Failed":
        responsePayload.message = `Critical error: Profile fetch failed for symbol ${result.symbol}. Other data fetches skipped.`;
        responsePayload.error = result.error;
        httpStatus = 500; // Profile is critical, so this is a more severe error for the symbol.
        break;
      default:
        responsePayload.message = `Unknown processing status for symbol ${result.symbol}.`;
        httpStatus = 500;
        break;
    }

    if (!responsePayload.error && result.error) {
      // Ensure error from result is included if not set by switch
      responsePayload.error = result.error;
    }
    if (!responsePayload.error) {
      // Clean up error field if no error
      delete responsePayload.error;
    }

    console.log(
      `[API FetchData/${symbol}] Responding for ${result.symbol}: ${responsePayload.message}`
    );
    return NextResponse.json(responsePayload, { status: httpStatus });
  } catch (e: unknown) {
    // Catch unexpected errors during the route handling itself
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error(
      `[API FetchData/${symbol}] Unexpected error processing symbol ${symbol}: ${errorMessage}`
    );
    return NextResponse.json(
      {
        message: `An unexpected error occurred while fetching data for symbol ${symbol}.`,
        symbol,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
