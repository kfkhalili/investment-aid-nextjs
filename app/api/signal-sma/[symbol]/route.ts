// app/api/signal-sma/[symbol]/route.ts
import { NextResponse } from "next/server";
import { processSmaSignalsForSymbol } from "@/lib/services/signal-sma/service";
import type { SmaProcessingResult } from "@/lib/services/signal-sma/service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
): Promise<NextResponse> {
  // Access symbol directly from params, uppercase it
  const { symbol: symbolParam } = await params;
  const symbol = symbolParam?.toUpperCase();

  console.log(
    `[API SmaSignal/${symbol}] Received request for symbol: ${symbol}`
  );

  try {
    const result: SmaProcessingResult = await processSmaSignalsForSymbol(
      symbol
    );

    const responsePayload: {
      message: string;
      symbol: string;
      signalsGenerated: number;
      status: string;
      latestSignalDate?: string | null;
      error?: string;
    } = {
      message: "", // Will be set below
      symbol: result.processedSymbol,
      signalsGenerated: result.signalsGenerated,
      status: result.status,
      latestSignalDate: result.latestSignalDate,
    };

    let httpStatus: number = 200;

    if (result.status === "error") {
      console.error(
        `[API SmaSignal/${symbol}] Service error for symbol ${result.processedSymbol}: ${result.error}`
      );
      responsePayload.message = `Error processing SMA signals for symbol ${result.processedSymbol}.`;
      responsePayload.error = result.error;
      httpStatus = 500;
    } else {
      switch (result.status) {
        case "processed":
          responsePayload.message = `Successfully processed SMA signals for symbol ${
            result.processedSymbol
          }. Signals generated: ${result.signalsGenerated}. Data from: ${
            result.latestSignalDate || "N/A"
          }.`;
          break;
        case "skipped_fresh":
          responsePayload.message = `SMA signals for symbol ${result.processedSymbol} are already fresh. No new signals generated.`;
          break;
        case "no_data_for_generation":
          responsePayload.message = `No new SMA signals generated for ${
            result.processedSymbol
          } (e.g. insufficient data). Data last attempted for: ${
            result.latestSignalDate || "N/A"
          }.`;
          if (result.error) {
            responsePayload.error = result.error;
          }
          break;
        default:
          responsePayload.message = `Unknown processing status for symbol ${result.processedSymbol}. Status: ${result.status}`;
          httpStatus = 500;
          break;
      }
    }

    console.log(
      `[API SmaSignal/${symbol}] Responding for ${result.processedSymbol}: ${responsePayload.message}`
    );
    // Clean up optional fields
    if (!responsePayload.error) delete responsePayload.error;
    if (!responsePayload.latestSignalDate)
      delete responsePayload.latestSignalDate;

    return NextResponse.json(responsePayload, { status: httpStatus });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error(
      `[API SmaSignal/${symbol}] Unexpected error processing symbol ${symbol}: ${errorMessage}`
    );
    return NextResponse.json(
      {
        message: `An unexpected error occurred while processing SMA signals for symbol ${symbol}.`,
        symbol,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
