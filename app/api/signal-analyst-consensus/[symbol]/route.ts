// app/api/signal-analyst-consensus/[symbol]/route.ts
import { NextResponse } from "next/server";
import { processAnalystConsensusForSymbol } from "@/lib/services/signal-analyst-consensus/service";
import type { AnalystProcessingResult } from "@/lib/services/signal-analyst-consensus/service"; // Import the result type

export async function GET(
  request: Request, // Keep request even if not used, for standard signature
  { params }: { params: Promise<{ symbol: string }> } // Next.js 13+ direct params
): Promise<NextResponse> {
  // Access symbol directly from params, uppercase it
  const { symbol: symbolParam } = await params;
  const symbol = symbolParam?.toUpperCase();

  console.log(
    `[API AnalystConsensus/${symbol}] Received request for symbol: ${symbol}`
  );

  try {
    const result: AnalystProcessingResult =
      await processAnalystConsensusForSymbol(symbol);

    if (result.status === "error") {
      console.error(
        `[API AnalystConsensus/${symbol}] Service error for symbol ${result.processedSymbol}: ${result.error}`
      );
      return NextResponse.json(
        {
          message: `Error processing analyst consensus for symbol ${result.processedSymbol}.`,
          symbol: result.processedSymbol,
          error: result.error,
        },
        { status: 500 }
      );
    }

    let httpStatus: number = 200;
    let message: string = "";

    switch (result.status) {
      case "processed":
        message = `Successfully processed analyst consensus for symbol ${result.processedSymbol}. Signals generated: ${result.signalsGenerated}.`;
        break;
      case "skipped_fresh":
        message = `Analyst consensus signals for symbol ${result.processedSymbol} are already fresh. No new signals generated.`;
        // httpStatus = 304; // Not Modified - though 200 with a message is also fine
        break;
      case "no_data_for_generation":
        message = `No new analyst consensus signals generated for ${result.processedSymbol} (no source data or no changes found).`;
        break;
      default:
        // Should not happen if service handles all statuses
        message = `Unknown processing status for symbol ${result.processedSymbol}.`;
        httpStatus = 500; // Treat unexpected status as an error
        break;
    }

    console.log(
      `[API AnalystConsensus/${symbol}] Responding for ${result.processedSymbol}: ${message}`
    );
    return NextResponse.json(
      {
        message,
        symbol: result.processedSymbol,
        signalsGenerated: result.signalsGenerated,
        status: result.status,
      },
      { status: httpStatus }
    );
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error(
      `[API AnalystConsensus/${symbol}] Unexpected error processing symbol ${symbol}: ${errorMessage}`
    );
    return NextResponse.json(
      {
        message: `An unexpected error occurred while processing analyst consensus for symbol ${symbol}.`,
        symbol,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
