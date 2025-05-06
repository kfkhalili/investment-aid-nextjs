// app/api/signals/[symbol]/route.ts
import { NextResponse } from "next/server";
import { getSignalsForSymbol } from "@/lib/services/signals"; // Orchestrator service
import type { SignalRow as DbSignalRow } from "@/lib/services/signals"; // DB row type
import {
  transformDbSignalToMarketSignal,
  type MarketSignal,
} from "@/lib/services/signals/formatting"; // Transformation service

export async function GET(
  request: Request, // Keep for standard signature
  { params }: { params: Promise<{ symbol: string }> }
): Promise<NextResponse<MarketSignal[] | { error: string }>> {
  // Access symbol directly from params, uppercase it
  const { symbol: symbolParam } = await params;
  const symbol = symbolParam?.toUpperCase();

  console.log(
    `[Signals] GET request for symbol: ${symbol}. This will process and transform signals.`
  );

  try {
    // Step 1: Ensure signals are up-to-date for this specific symbol and get raw data.
    // getSignalsForSymbol is the orchestrator that calls all individual signal processors.
    const rawSignals: DbSignalRow[] = await getSignalsForSymbol(symbol);

    if (!rawSignals) {
      // Should ideally always be an array from getSignalsForSymbol
      console.warn(
        `[Signals] getSignalsForSymbol returned null or undefined for ${symbol}.`
      );
      return NextResponse.json([], { status: 200 }); // Return empty array
    }

    // Step 2: Transform the raw signals into the MarketSignal format for the frontend.
    const marketSignals: MarketSignal[] = rawSignals.map(
      transformDbSignalToMarketSignal
    );

    console.log(
      `[Signals] Successfully processed and transformed signals for ${symbol}. Total market signals: ${marketSignals.length}.`
    );
    return NextResponse.json(marketSignals, { status: 200 });
  } catch (error: unknown) {
    let errorMessage = `An unknown error occurred while processing signals for symbol ${symbol}.`;

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    console.error(
      `[Signals] Critical error for symbol ${symbol}:`,
      errorMessage,
      error // Log the original error object for more details
    );
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
