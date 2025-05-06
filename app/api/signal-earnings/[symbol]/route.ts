// app/api/signal-earnings/[symbol]/route.ts
import { NextResponse } from "next/server";
import { processEarningsSignalsForSymbol } from "@/lib/services/signal-earnings/service";
import type { EarningsProcessingResult } from "@/lib/services/signal-earnings/service";

export async function GET(
  request: Request, // Keep for standard signature, even if not directly used
  { params }: { params: Promise<{ symbol: string }> } // Next.js 13+ direct params
): Promise<NextResponse> {
  // Access symbol directly from params, uppercase it
  const { symbol: symbolParam } = await params;
  const symbol = symbolParam?.toUpperCase();

  console.log(
    `[API EarningsSignal/${symbol}] Received request for symbol: ${symbol}`
  );

  try {
    const result: EarningsProcessingResult =
      await processEarningsSignalsForSymbol(symbol);

    if (result.status === "error") {
      console.error(
        `[API EarningsSignal/${symbol}] Service error for symbol ${result.processedSymbol}: ${result.error}`
      );
      return NextResponse.json(
        {
          message: `Error processing earnings signals for symbol ${result.processedSymbol}.`,
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
        message = `Successfully processed earnings signals for symbol ${result.processedSymbol}. Signals generated: ${result.signalsGenerated}.`;
        break;
      case "skipped_fresh":
        message = `Earnings signals for symbol ${result.processedSymbol} are already fresh. No new signals generated.`;
        break;
      case "no_data_for_generation":
        message = `No new earnings signals generated for ${result.processedSymbol} (no relevant calendar data or conditions met).`;
        break;
      default:
        message = `Unknown processing status for symbol ${result.processedSymbol}. Status: ${result.status}`;
        httpStatus = 500; // Treat unexpected status as an error
        break;
    }

    console.log(
      `[API EarningsSignal/${symbol}] Responding for ${result.processedSymbol}: ${message}`
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
      `[API EarningsSignal/${symbol}] Unexpected error processing symbol ${symbol}: ${errorMessage}`
    );
    return NextResponse.json(
      {
        message: `An unexpected error occurred while processing earnings signals for symbol ${symbol}.`,
        symbol,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
